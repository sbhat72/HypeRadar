package com.hyperadar.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
public class AlphaVantageQuoteDto {

    @JsonProperty("01. symbol")
    private String symbol;

    @JsonProperty("05. price")
    private Double price;

    @JsonProperty("06. volume")
    private Long volume;

    @JsonProperty("08. previous close")
    private Double previousClose;

    @JsonProperty("09. change")
    private Double change;

    @JsonProperty("10. change percent")
    private String changePercent;
}
