package com.spliteasy.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RatePointResponse(LocalDate date, BigDecimal rate) {
}
