package com.hyperadar.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoricalEventDto {
    private Long id;
    private String tickerSymbol;
    private String eventName;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
}
