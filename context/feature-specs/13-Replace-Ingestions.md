Read `AGENTS.md` before starting.

# Fix: Replace Reddit with StockTwits

## Why

Reddit now requires app approval for API access. StockTwits is a
better replacement — it is purpose-built for stock market social
sentiment, requires no authentication for public reads, and returns
messages with built-in bullish/bearish sentiment labels already
attached. No API key, no OAuth, no approval process.

---

## Step 1 — Add STOCKTWITS to the Source Enum

In `model/SentimentEvent.java`, add `STOCKTWITS` to the Source enum
and remove `REDDIT`:

```java
public enum Source {
    STOCKTWITS, YAHOO_FINANCE, CNBC, MARKETWATCH, NASDAQ
}
```

---

## Step 2 — Create StockTwitsService

Create `service/ingestion/StockTwitsService.java`. This service polls
StockTwits for every ticker currently in the database and creates
SentimentEvents from the messages it finds.

### API endpoint

```
GET https://api.stocktwits.com/api/2/streams/symbol/{SYMBOL}.json
```

No headers, no authentication. Returns up to 30 recent messages for
the ticker.

### Response shape

```json
{
  "messages": [
    {
      "id": 123456789,
      "body": "$TSLA breaking out above resistance!",
      "created_at": "2026-06-26T20:00:00Z",
      "entities": {
        "sentiment": {
          "basic": "Bullish"
        }
      }
    }
  ]
}
```

`entities.sentiment` is null when the user did not tag a sentiment.
`basic` is either `"Bullish"` or `"Bearish"` when present.

### Implementation

```java
package com.hyperadar.service.ingestion;

import com.fasterxml.jackson.databind.JsonNode;
import com.hyperadar.model.SentimentEvent;
import com.hyperadar.model.Ticker;
import com.hyperadar.repository.SentimentEventRepository;
import com.hyperadar.repository.TickerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockTwitsService {

    private final TickerRepository tickerRepository;
    private final SentimentEventRepository sentimentEventRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    private static final String BASE_URL =
        "https://api.stocktwits.com/api/2/streams/symbol/{symbol}.json";

    public void poll() {
        List<Ticker> tickers = tickerRepository.findAll();

        for (Ticker ticker : tickers) {
            try {
                pollTicker(ticker);
                // Small delay to avoid hitting StockTwits rate limits
                Thread.sleep(200);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                log.error("StockTwits poll failed for {}: {}", ticker.getSymbol(), e.getMessage());
            }
        }
    }

    private void pollTicker(Ticker ticker) {
        JsonNode response = restTemplate.getForObject(
            BASE_URL, JsonNode.class, ticker.getSymbol()
        );

        if (response == null || !response.has("messages")) return;

        for (JsonNode message : response.get("messages")) {
            String body = message.path("body").asText("");
            if (body.isBlank()) continue;

            SentimentEvent.Polarity polarity = extractPolarity(message);

            SentimentEvent event = SentimentEvent.builder()
                .ticker(ticker)
                .source(SentimentEvent.Source.STOCKTWITS)
                .content(body)
                .polarity(polarity)
                .createdAt(LocalDateTime.now())
                .build();

            sentimentEventRepository.save(event);
        }

        log.info("StockTwits polled {} — messages saved", ticker.getSymbol());
    }

    private SentimentEvent.Polarity extractPolarity(JsonNode message) {
        JsonNode sentiment = message.path("entities").path("sentiment");
        if (sentiment.isMissingNode() || sentiment.isNull()) {
            return SentimentEvent.Polarity.NEUTRAL;
        }
        String basic = sentiment.path("basic").asText("");
        if ("Bullish".equalsIgnoreCase(basic)) return SentimentEvent.Polarity.POSITIVE;
        if ("Bearish".equalsIgnoreCase(basic)) return SentimentEvent.Polarity.NEGATIVE;
        return SentimentEvent.Polarity.NEUTRAL;
    }
}
```

---

## Step 3 — Update DataPipelineScheduler

Remove the `RedditPollerService` dependency and replace it with
`StockTwitsService`. The new pipeline order is:

```
1. RssFeedParserService.parse()    <- discovers tickers from news feeds
2. StockTwitsService.poll()        <- polls social sentiment per ticker
3. HypeScoreEngineService.computeAll()
4. BullishBearishClassifierService.classifyAll()
5. LiveWebSocketController.broadcastUpdate()
```

StockTwits runs AFTER RSS parsing because it polls tickers that
already exist in the database. RSS parsing is what creates new Ticker
rows, so it must run first.

Updated `DataPipelineScheduler.java`:

```java
@Scheduled(fixedDelay = 300000)
public void runPipeline() {
    log.info("Pipeline cycle started at {}", LocalDateTime.now());

    try {
        rssFeedParserService.parse();
    } catch (Exception e) {
        log.error("RSS feed parsing failed: {}", e.getMessage());
    }

    try {
        stockTwitsService.poll();
    } catch (Exception e) {
        log.error("StockTwits polling failed: {}", e.getMessage());
    }

    try {
        hypeScoreEngineService.computeAll();
        bullishBearishClassifierService.classifyAll();
        liveWebSocketController.broadcastUpdate();
    } catch (Exception e) {
        log.error("Processing pipeline failed: {}", e.getMessage());
    }

    log.info("Pipeline cycle completed at {}", LocalDateTime.now());
}
```

---

## Step 4 — Remove RedditPollerService

Delete `service/ingestion/RedditPollerService.java` entirely. Remove
any remaining imports or references to it across the codebase.

Also remove these now-unused properties from `application-local.properties`
and `application.properties`:

```properties
# Remove these:
reddit.user-agent=...
reddit.subreddits=...
```

---

## Step 5 — Fix Reuters RSS Feed

In `application-local.properties`, replace the dead Reuters feed URL:

```properties
# Remove:
rss.feed.reuters=https://feeds.reuters.com/reuters/businessNews

# Add:
rss.feed.yahoofinance=https://finance.yahoo.com/news/rssindex
```

In `RssFeedParserService.java`, update the @Value field:

```java
// Change:
@Value("${rss.feed.reuters}")
private String reutersFeedUrl;

// To:
@Value("${rss.feed.yahoofinance}")
private String yahooFinanceFeedUrl;
```

Update all references from `reutersFeedUrl` to `yahooFinanceFeedUrl`
and update the source on events from this feed from `REUTERS` to
`YAHOO_FINANCE`.

---

## Check When Done

- [ ] `SentimentEvent.Source` enum has `STOCKTWITS` and `YAHOO_FINANCE`,
  no `REDDIT` or `REUTERS`
- [ ] `StockTwitsService.java` created and compiles without errors
- [ ] `StockTwitsService.poll()` called in `DataPipelineScheduler`
  after `RssFeedParserService.parse()`
- [ ] `RedditPollerService.java` deleted with no remaining references
- [ ] `rss.feed.reuters` replaced with `rss.feed.yahoofinance` in properties
- [ ] `RssFeedParserService` reads from Yahoo Finance feed URL
- [ ] Backend starts and pipeline runs without Reddit or Reuters errors
- [ ] After one pipeline cycle tickers appear in Supabase
- [ ] After two pipeline cycles hype scores appear and dashboard populates