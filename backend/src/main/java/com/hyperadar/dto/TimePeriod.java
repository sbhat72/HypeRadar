package com.hyperadar.dto;

import java.time.LocalDateTime;
import java.util.Arrays;

public enum TimePeriod {
    H1("1H") {
        public LocalDateTime cutoff(LocalDateTime now) { return now.minusHours(1); }
    },
    D1("1D") {
        public LocalDateTime cutoff(LocalDateTime now) { return now.minusDays(1); }
    },
    W1("1W") {
        public LocalDateTime cutoff(LocalDateTime now) { return now.minusDays(7); }
    },
    M1("1M") {
        public LocalDateTime cutoff(LocalDateTime now) { return now.minusDays(30); }
    };

    private final String code;

    TimePeriod(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    public abstract LocalDateTime cutoff(LocalDateTime now);

    public static TimePeriod fromCode(String raw) {
        String normalized = raw == null ? "" : raw.trim();
        return Arrays.stream(values())
                .filter(p -> p.code.equalsIgnoreCase(normalized))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown period: " + raw));
    }
}
