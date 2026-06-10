package com.hyperadar.service.ingestion;

import org.springframework.stereotype.Service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import java.util.List;

@Service
public class RedditPollerService {

    @Value("${reddit.user-agent}")
    private String userAgent;

    @Value("${reddit.subreddits}")
    private List<String> subreddits;

    private final RestTemplate restTemplate = new RestTemplate();

    private HttpEntity<Void> buildRequest() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", userAgent);
        return new HttpEntity<>(headers);
    }


    private String fetchSubredditPosts(String subreddit) {
    ResponseEntity<String> response = restTemplate.exchange(
        "https://www.reddit.com/r/" + subreddit + "/hot.json?limit=100",
        HttpMethod.GET,
        buildRequest(),
        String.class
    );
    return response.getBody();
}

public void poll() {
    for (String subreddit : subreddits) {
        String json = fetchSubredditPosts(subreddit);
        // your parsing and SentimentEvent writing logic goes here
    }
}
}