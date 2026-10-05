package com.spliteasy;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Entry point of the SplitEasy API.
 */
@SpringBootApplication
@EnableScheduling
public class SplitEasyApplication {

    public static void main(String[] args) {
        SpringApplication.run(SplitEasyApplication.class, args);
    }
}
