package com.hyperadar.dto;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;

@Getter
public class AlphaVantageResponseDto {

    @JsonProperty("Global Quote")
    private AlphaVantageQuoteDto globalQuote;
}
