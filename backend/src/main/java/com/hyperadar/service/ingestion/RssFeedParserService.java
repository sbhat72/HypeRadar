package com.hyperadar.service.ingestion;

import org.springframework.stereotype.Service;

import com.hyperadar.model.Ticker;
import com.rometools.rome.feed.synd.SyndEntry;
import com.rometools.rome.feed.synd.SyndFeed;
import com.rometools.rome.io.FeedException;
import com.rometools.rome.io.SyndFeedInput;
import com.rometools.rome.io.XmlReader;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import java.util.regex.Matcher;

import java.io.IOException;
import java.net.URL;

@Service
public class RssFeedParserService {
    @Value("${rss.feed.reuters}")
    private String reutersFeedUrl;

    @Value("${rss.feed.cnbc}")
    private String cnbcFeedUrl;

    @Value("${rss.feed.marketwatch}")
    private String marketWatchFeedUrl;

    @Value("${rss.feed.nasdaq}")
    private String nasdaqFeedUrl;


    private List<String> getFeedUrls() {
        return List.of(reutersFeedUrl, cnbcFeedUrl, marketWatchFeedUrl, nasdaqFeedUrl);
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

    List<String> FindTickerMentions() throws IllegalArgumentException, FeedException, IOException {
        ArrayList<String> tickers = new ArrayList<>();
        Map<String, List<String>> headlinesMap = getHeadlines();
        for(List<String> headlines : headlinesMap.values()) {
            for(String headline : headlines) {
                // extract ticker mentions from headline and store in a list
                // this is a placeholder implementation, you can use regex or a more sophisticated approach to extract tickers

                Pattern pattern = Pattern.compile("\\b[A-Z]{1,5}\\b");
                Matcher matcher = pattern.matcher(headline);
                while (matcher.find()) {
                    String symbol = matcher.group();
                    tickers.add(symbol);
                }
                if(headline.contains("$")) {
                    String ticker = headline.substring(headline.indexOf("$") + 1).split(" ")[0];
                    tickers.add(ticker);
                }
            }
        }
        return tickers; // Placeholder return, replace with actual list of tickers
    }

    



}
