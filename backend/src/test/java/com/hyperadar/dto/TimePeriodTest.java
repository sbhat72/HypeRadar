package com.hyperadar.dto;

import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TimePeriodTest {

    private final LocalDateTime now = LocalDateTime.of(2026, 7, 18, 12, 0);

    @Test
    void fromCode_parsesKnownCodesCaseInsensitively() {
        assertThat(TimePeriod.fromCode("1H")).isEqualTo(TimePeriod.H1);
        assertThat(TimePeriod.fromCode("1d")).isEqualTo(TimePeriod.D1);
        assertThat(TimePeriod.fromCode(" 1W ")).isEqualTo(TimePeriod.W1);
        assertThat(TimePeriod.fromCode("1m")).isEqualTo(TimePeriod.M1);
    }

    @Test
    void fromCode_throwsOnUnknownCode() {
        assertThatThrownBy(() -> TimePeriod.fromCode("bogus"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> TimePeriod.fromCode(null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void cutoff_returnsExpectedRollingWindowPerPeriod() {
        assertThat(Duration.between(TimePeriod.H1.cutoff(now), now)).isEqualTo(Duration.ofHours(1));
        assertThat(Duration.between(TimePeriod.D1.cutoff(now), now)).isEqualTo(Duration.ofDays(1));
        assertThat(Duration.between(TimePeriod.W1.cutoff(now), now)).isEqualTo(Duration.ofDays(7));
        assertThat(Duration.between(TimePeriod.M1.cutoff(now), now)).isEqualTo(Duration.ofDays(30));
    }
}
