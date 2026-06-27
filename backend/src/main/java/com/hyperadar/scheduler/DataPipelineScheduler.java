package com.hyperadar.scheduler;

import com.hyperadar.controller.LiveWebSocketController;
import com.hyperadar.service.ingestion.RssFeedParserService;
import com.hyperadar.service.ingestion.StockTwitsService;
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

    private final RssFeedParserService rssFeedParserService;
    private final StockTwitsService stockTwitsService;
    private final HypeScoreEngineService hypeScoreEngineService;
    private final BullishBearishClassifierService bullishBearishClassifierService;
    private final LiveWebSocketController liveWebSocketController;

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
}
