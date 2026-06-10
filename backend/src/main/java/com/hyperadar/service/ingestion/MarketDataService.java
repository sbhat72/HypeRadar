package com.hyperadar.service.ingestion;

import org.springframework.stereotype.Service;

import lombok.AllArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;

import com.hyperadar.dto.AlphaVantageQuoteDto;
import com.hyperadar.dto.AlphaVantageResponseDto;



@Service
public class MarketDataService {
    @Value("${alphavantage.api-key}")
    private String alphaApiKey;

    @Value("${alphavantage.base-url}")
    private String BASE_URL;

    private final RestTemplate restTemplate = new RestTemplate();


    public AlphaVantageQuoteDto fetchQuote(String ticker) {
        AlphaVantageResponseDto response = restTemplate.getForObject(BASE_URL + "?function=GLOBAL_QUOTE&symbol=" + ticker + "&apikey=" + alphaApiKey, AlphaVantageResponseDto.class);
        return response.getGlobalQuote();
    }






}
