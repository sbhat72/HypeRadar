package com.hyperadar.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "sentiment_events")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SentimentEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "ticker_id", nullable = false)
    private Ticker ticker;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Source source;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Polarity polarity;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum Source {
        REDDIT,
        REUTERS,
        CNBC
    }

    public enum Polarity {
        POSITIVE,
        NEGATIVE,
        NEUTRAL
    }
}
