package com.example.Rental.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.KeyGenerator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Duration;
import java.util.Map;

@Configuration
@EnableCaching
public class CacheConfig {

    private static ObjectMapper buildCacheObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
        BasicPolymorphicTypeValidator ptv = BasicPolymorphicTypeValidator.builder()
                .allowIfBaseType(Object.class)
                .build();
        mapper.activateDefaultTyping(ptv, ObjectMapper.DefaultTyping.NON_FINAL, JsonTypeInfo.As.PROPERTY);
        return mapper;
    }

    @Bean("currentUserKeyGenerator")
    public KeyGenerator currentUserKeyGenerator() {
        return (target, method, params) -> {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            return (auth != null) ? auth.getName() : "anonymous";
        };
    }

    private RedisCacheConfiguration defaultCacheConfig() {
        GenericJackson2JsonRedisSerializer jsonSerializer =
                new GenericJackson2JsonRedisSerializer(buildCacheObjectMapper());
        return RedisCacheConfiguration.defaultCacheConfig()
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(jsonSerializer))
                .disableCachingNullValues()
                .prefixCacheNameWith("rental:");
    }

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory factory) {
        RedisCacheConfiguration base = defaultCacheConfig();
        Map<String, RedisCacheConfiguration> perCacheConfig = Map.of(
                CacheConstants.STATISTICS,              base.entryTtl(Duration.ofMinutes(5)),
                CacheConstants.POSTS_SEARCH,            base.entryTtl(Duration.ofMinutes(30)),
                CacheConstants.POST_DETAIL,             base.entryTtl(Duration.ofMinutes(30)),
                CacheConstants.POST_STATISTICS,         base.entryTtl(Duration.ofMinutes(30)),
                CacheConstants.ROOM_REVIEWS,            base.entryTtl(Duration.ofHours(2)),
                CacheConstants.RENTER_REVIEWS,          base.entryTtl(Duration.ofHours(2)),
                CacheConstants.ROOM_DETAIL,             base.entryTtl(Duration.ofHours(1)),
                CacheConstants.NOTIFICATION_UNREAD_COUNT, base.entryTtl(Duration.ofMinutes(15)),
                CacheConstants.USER_PROFILE,            base.entryTtl(Duration.ofHours(1))
        );
        return RedisCacheManager.builder(factory)
                .cacheDefaults(base.entryTtl(Duration.ofMinutes(30)))
                .withInitialCacheConfigurations(perCacheConfig)
                .transactionAware()
                .build();
    }
}
