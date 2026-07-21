package com.hyperadar.service.ingestion;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.hyperadar.model.SentimentEvent;
import com.hyperadar.model.Ticker;
import com.hyperadar.repository.SentimentEventRepository;
import com.hyperadar.repository.TickerRepository;
import com.rometools.rome.feed.synd.SyndEntry;
import com.rometools.rome.feed.synd.SyndFeed;
import com.rometools.rome.io.FeedException;
import com.rometools.rome.io.SyndFeedInput;
import com.rometools.rome.io.XmlReader;

import jakarta.annotation.PostConstruct;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import java.util.regex.Matcher;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URL;
import java.util.Set;

@Service
public class RssFeedParserService {

    private static final Logger log = LoggerFactory.getLogger(RssFeedParserService.class);

    @Value("${rss.feed.yahoofinance}")
    private String yahooFinanceFeedUrl;

    @Value("${rss.feed.cnbc}")
    private String cnbcFeedUrl;

    @Value("${rss.feed.marketwatch}")
    private String marketWatchFeedUrl;

    @Value("${rss.feed.nasdaq}")
    private String nasdaqFeedUrl;

    @Value("${alphavantage.api-key}")
    private String alphaApiKey;

    private final RestTemplate restTemplate;
    private Set<String> validTickers = new HashSet<>();

    public RssFeedParserService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);
        factory.setReadTimeout(10_000);
        this.restTemplate = new RestTemplate(factory);
    }

    @Autowired
    private TickerRepository tickerRepository;

    @Autowired
    private SentimentEventRepository sentimentEventRepository;


    private List<String> getFeedUrls() {
        return List.of(yahooFinanceFeedUrl, cnbcFeedUrl, marketWatchFeedUrl, nasdaqFeedUrl);
    }

    Map<String, List<String>> getHeadlines() throws IllegalArgumentException, FeedException, IOException{
        Map<String, List<String>> headlinesMap = new HashMap<>();
        List<String> feedUrls = getFeedUrls();
        for(String url : feedUrls) {
            // fetch and parse RSS feed, extract headlines, and store in a map
            URL feedUrl = new URL(url);
            SyndFeedInput input = new SyndFeedInput();
            SyndFeed feed = input.build(new XmlReader(feedUrl));
            List<SyndEntry> entries = feed.getEntries();
            entries.forEach(entry -> {
                String headline = entry.getTitle();
                headlinesMap.computeIfAbsent(url, k -> new ArrayList<>()).add(headline);
            });
        }
        return headlinesMap;
    }

        Set<String> findTickerMentions(String headline) {
        Set<String> tickers = new HashSet<>();

        Pattern uppercasePattern = Pattern.compile("\\b[A-Z]{1,5}\\b");
        Matcher uppercaseMatcher = uppercasePattern.matcher(headline);
        while (uppercaseMatcher.find()) {
            String symbol = uppercaseMatcher.group();
            if (!validTickers.isEmpty() && !validTickers.contains(symbol)) continue;
            tickers.add(symbol);
        }

        Pattern cashtagPattern = Pattern.compile("\\$([A-Z]{1,5})");
        Matcher cashtagMatcher = cashtagPattern.matcher(headline);
        while (cashtagMatcher.find()) {
            String symbol = cashtagMatcher.group(1);
            if (!validTickers.isEmpty() && !validTickers.contains(symbol)) continue;
            tickers.add(symbol);
        }

        return tickers;
    }

        private Set<String> positiveWords = new HashSet<>();
        private Set<String> negativeWords = new HashSet<>();

        @PostConstruct
        public void loadSentimentDictionary() {
            try {
                InputStream is = getClass().getResourceAsStream("/Loughran-McDonald_MasterDictionary_1993-2025.csv");
                if (is == null) {
                    log.warn("Sentiment dictionary not found on classpath — scoring will return NEUTRAL for all headlines");
                    return;
                }
                BufferedReader reader = new BufferedReader(new InputStreamReader(is));
                String line;
                reader.readLine(); // skip header
                while ((line = reader.readLine()) != null) {
                    String[] cols = line.split(",");
                    String word = cols[0];
                    int negative = Integer.parseInt(cols[7]);
                    int positive = Integer.parseInt(cols[8]);
                    if (negative != 0) negativeWords.add(word);
                    if (positive != 0) positiveWords.add(word);
                }
            } catch (Exception e) {
                log.warn("Failed to load sentiment dictionary — scoring will return NEUTRAL for all headlines: {}", e.getMessage());
            }
        }

        @PostConstruct
        public void loadValidTickers() {
            try {
                String url = "https://www.alphavantage.co/query?function=LISTING_STATUS&apikey=" + alphaApiKey;
                String csv = restTemplate.getForObject(url, String.class);
                String[] rows = csv.split("\n");
                for (int i = 1; i < rows.length; i++) {
                    String[] cols = rows[i].split(",");
                    if (cols.length > 0) validTickers.add(cols[0].trim());
                }
                log.info("Loaded {} valid tickers from Alpha Vantage listing status", validTickers.size());
            } catch (Exception e) {
                log.warn("Could not load ticker universe from Alpha Vantage (rate limited or unreachable) — all discovered symbols will be accepted: {}", e.getMessage());
            }
        }




        public SentimentEvent.Polarity scoreSentiment(String headline) {
            String[] words = headline.toUpperCase().split("\\s+");
            int score = 0;
            for (String word : words) {
                if (positiveWords.contains(word)) score++;
                if (negativeWords.contains(word)) score--;
            }
            if (score > 0) return SentimentEvent.Polarity.POSITIVE;
            if (score < 0) return SentimentEvent.Polarity.NEGATIVE;
            return SentimentEvent.Polarity.NEUTRAL;
        }

        public void parse() throws IllegalArgumentException, FeedException, IOException {
        Map<String, List<String>> headlinesMap = getHeadlines();

        Map<String, SentimentEvent.Source> urlToSource = new HashMap<>();
        urlToSource.put(yahooFinanceFeedUrl, SentimentEvent.Source.YAHOO_FINANCE);
        urlToSource.put(cnbcFeedUrl, SentimentEvent.Source.CNBC);
        urlToSource.put(marketWatchFeedUrl, SentimentEvent.Source.MARKETWATCH);
        urlToSource.put(nasdaqFeedUrl, SentimentEvent.Source.NASDAQ);

        for (Map.Entry<String, List<String>> entry : headlinesMap.entrySet()) {
            String url = entry.getKey();
            List<String> headlines = entry.getValue();
            SentimentEvent.Source source = urlToSource.get(url);

            for (String headline : headlines) {
                Set<String> tickerSymbols = findTickerMentions(headline);
                SentimentEvent.Polarity polarity = scoreSentiment(headline);

                for (String symbol : tickerSymbols) {
                    Ticker ticker = tickerRepository.findBySymbol(symbol)
                        .orElseGet(() -> tickerRepository.save(
                            Ticker.builder().symbol(symbol).build()
                        ));

                    SentimentEvent event = SentimentEvent.builder()
                        .ticker(ticker)
                        .source(source)
                        .content(headline)
                        .polarity(polarity)
                        .build();

                    sentimentEventRepository.save(event);
                }
            }
        }
}

    



}
