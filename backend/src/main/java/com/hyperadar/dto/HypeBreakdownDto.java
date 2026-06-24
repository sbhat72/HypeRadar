package com.hyperadar.dto;

import com.hyperadar.model.HypeScore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HypeBreakdownDto {
    private String symbol;
    private Double currentScore;
    private Double redditScore;
    private Double newsScore;
    private Double volumeScore;
    private Double priceScore;
    private HypeScore.Verdict verdict;
    private Double currentPrice;
    private Double priceChange;
    private Double changePercent;
    private List<HypeScorePointDto> scoreHistory;
    private List<SentimentSourceDto> sources;
}
