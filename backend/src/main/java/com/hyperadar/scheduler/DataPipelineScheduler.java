package com.hyperadar.scheduler;

import com.hyperadar.controller.LiveWebSocketController;
import com.hyperadar.service.ingestion.RedditPollerService;
import com.hyperadar.service.ingestion.RssFeedParserService;
import com.hyperadar.service.processing.BullishBearishClassifierService;
import com.hyperadar.service.processing.HypeScoreEngineService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Slf4j
@Component
@AllArgsConstructor
public class DataPipelineScheduler {

    private final RedditPollerService redditPollerService;
    private final RssFeedParserService rssFeedParserService;
    private final HypeScoreEngineService hypeScoreEngineService;
    private final BullishBearishClassifierService bullishBearishClassifierService;
    private final LiveWebSocketController liveWebSocketController;

    @Scheduled(fixedDelay = 300000)
    public void runPipeline() {
        log.info("Pipeline cycle started at {}", LocalDateTime.now());

        try {
            redditPollerService.poll();
        } catch (Exception e) {
            log.error("Reddit polling failed: {}", e.getMessage(), e);
        }

        try {
            rssFeedParserService.parse();
        } catch (Exception e) {
            log.error("RSS feed parsing failed: {}", e.getMessage(), e);
        }

        try {
            hypeScoreEngineService.computeAll();
            bullishBearishClassifierService.classifyAll();
            liveWebSocketController.broadcastUpdate();
        } catch (Exception e) {
            log.error("Processing or broadcast failed: {}", e.getMessage(), e);
        }

        log.info("Pipeline cycle completed at {}", LocalDateTime.now());
    }
}
