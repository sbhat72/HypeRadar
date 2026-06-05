package com.hyperadar.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class DataPipelineScheduler {

    @Scheduled(fixedRate = 300000)
    public void runPipeline() {
        // TODO: run ingestion -> processing pipeline every 5 minutes
    }
}
