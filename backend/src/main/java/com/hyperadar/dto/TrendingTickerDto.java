package com.hyperadar.dto;

import com.hyperadar.model.HypeScore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrendingTickerDto {
    private String symbol;
    private Double score;
    private Double redditScore;
    private Double newsScore;
    private Double volumeScore;
    private Double priceScore;
    private HypeScore.Verdict verdict;
    private Double priceChange;
    private Double changePercent;
    private Integer mentionCount;
}
