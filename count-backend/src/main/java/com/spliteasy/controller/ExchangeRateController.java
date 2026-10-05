package com.spliteasy.controller;

import com.spliteasy.dto.response.ExchangeRateHistoryResponse;
import com.spliteasy.entity.enums.Currency;
import com.spliteasy.service.ExchangeRateService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Taux de change")
@RestController
@RequestMapping("/api/exchange-rates")
@RequiredArgsConstructor
public class ExchangeRateController {

    private final ExchangeRateService exchangeRateService;

    @GetMapping("/history")
    public ExchangeRateHistoryResponse history(
            @RequestParam Currency from,
            @RequestParam Currency to,
            @RequestParam(defaultValue = "30") int days) {
        return exchangeRateService.getHistory(from, to, days);
    }
}
