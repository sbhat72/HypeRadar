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

import org.springframework.beans.factory.annotation.Value;

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

    List<Ticker> getTickers() {
        
    }



}
