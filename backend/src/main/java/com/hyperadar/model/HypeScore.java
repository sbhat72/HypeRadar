package com.hyperadar.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "hype_scores")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HypeScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "ticker_id", nullable = false)
    private Ticker ticker;

    @Column(nullable = false)
    private Double score;

    @Column(name = "reddit_score")
    private Double redditScore;

    @Column(name = "news_score")
    private Double newsScore;

    @Column(name = "volume_score")
    private Double volumeScore;

    @Column(name = "fifty_two_week_score")
    private Double fiftyTwoWeekScore;

    @Enumerated(EnumType.STRING)
    @Column
    private Verdict verdict;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum Verdict {
        HYPE_CONFIRMED,
        PURE_HYPE,
        HIDDEN_MOMENTUM,
        BEARISH_CONFIRMATION
    }
}
