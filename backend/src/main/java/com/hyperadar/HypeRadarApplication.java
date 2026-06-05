package com.hyperadar;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class HypeRadarApplication {
    public static void main(String[] args) {
        SpringApplication.run(HypeRadarApplication.class, args);
    }
}
