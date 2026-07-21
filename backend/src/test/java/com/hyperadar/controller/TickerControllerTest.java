package com.hyperadar.controller;

import com.hyperadar.dto.TrendingTickerDto;
import com.hyperadar.model.HypeScore;
import com.hyperadar.repository.SentimentEventRepository;
import com.hyperadar.service.HypeDataService;
import com.hyperadar.service.RedisCacheService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Symbols used below are deliberately not valid 1-5 letter tickers so
 * {@code TickerController.fetchYahooPrice} short-circuits on its regex check
 * instead of making a real network call.
 */
@ExtendWith(MockitoExtension.class)
class TickerControllerTest {

    @Mock
    private HypeDataService hypeDataService;

    @Mock
    private RedisCacheService redisCacheService;

    private TickerController controller;

    @BeforeEach
    void setUp() {
        controller = new TickerController(hypeDataService, redisCacheService);
    }

    @Test
    void trending_withValidPeriod_ranksByMentionCountFromRepository() {
        SentimentEventRepository.TickerMentionCount first = mock(SentimentEventRepository.TickerMentionCount.class);
        when(first.getSymbol()).thenReturn("AAAAAA");
        when(first.getMentionCount()).thenReturn(50L);

        SentimentEventRepository.TickerMentionCount second = mock(SentimentEventRepository.TickerMentionCount.class);
        when(second.getSymbol()).thenReturn("BBBBBB");
        when(second.getMentionCount()).thenReturn(10L);

        when(hypeDataService.getTopTickersByMentionCount(any(LocalDateTime.class), eq(10)))
                .thenReturn(List.of(first, second));
        when(hypeDataService.getLatestScore(anyString())).thenReturn(Optional.empty());

        ResponseEntity<List<TrendingTickerDto>> response = controller.getTrending(10, "1W");

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        List<TrendingTickerDto> body = response.getBody();
        assertThat(body).hasSize(2);
        assertThat(body.get(0).getSymbol()).isEqualTo("AAAAAA");
        assertThat(body.get(0).getMentionCount()).isEqualTo(50);
        assertThat(body.get(1).getSymbol()).isEqualTo("BBBBBB");
        assertThat(body.get(1).getMentionCount()).isEqualTo(10);

        ArgumentCaptor<LocalDateTime> sinceCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(hypeDataService).getTopTickersByMentionCount(sinceCaptor.capture(), eq(10));
        long hoursBack = Duration.between(sinceCaptor.getValue(), LocalDateTime.now()).toHours();
        assertThat(hoursBack).isBetween(167L, 169L); // ~7 days, allowing for test execution time

        verify(redisCacheService, never()).getTopTickers(anyInt());
    }

    @Test
    void trending_withInvalidPeriod_returnsBadRequest() {
        ResponseEntity<List<TrendingTickerDto>> response = controller.getTrending(10, "bogus");

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        verifyNoInteractions(hypeDataService, redisCacheService);
    }

    @Test
    void trending_withoutPeriod_usesLegacyRedisRankedByScore() {
        when(redisCacheService.getTopTickers(10)).thenReturn(new LinkedHashSet<>(List.of("AAAAAA")));
        HypeScore score = HypeScore.builder().score(77.0).build();
        when(hypeDataService.getLatestScore("AAAAAA")).thenReturn(Optional.of(score));
        when(hypeDataService.getMentionCountHours("AAAAAA")).thenReturn(5);

        ResponseEntity<List<TrendingTickerDto>> response = controller.getTrending(10, null);

        List<TrendingTickerDto> body = response.getBody();
        assertThat(body).hasSize(1);
        assertThat(body.get(0).getMentionCount()).isEqualTo(5);

        verify(redisCacheService).getTopTickers(10);
        verify(hypeDataService, never()).getTopTickersByMentionCount(any(), anyInt());
    }
}
