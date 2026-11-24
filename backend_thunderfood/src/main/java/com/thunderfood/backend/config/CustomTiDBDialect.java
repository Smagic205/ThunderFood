package com.thunderfood.backend.config;

import org.hibernate.LockOptions;
import org.hibernate.dialect.MySQLDialect;

/**
 * Custom Dialect tương thích với TiDB Cloud.
 * Loại bỏ hoàn toàn mệnh đề "OF <aliases>" mà Hibernate tự sinh ra,
 * giúp tương thích 100% với TiDB Cloud trên mọi loại khóa bi quan (Pessimistic Lock).
 */
public class CustomTiDBDialect extends MySQLDialect {

    @Override
    public String getForUpdateString() {
        return " for update";
    }

    @Override
    public String getForUpdateString(String aliases, LockOptions lockOptions) {
        return " for update";
    }

    @Override
    public String getForUpdateString(LockOptions lockOptions) {
        return " for update";
    }

    @Override
    public String getForUpdateNowaitString() {
        return " for update nowait";
    }

    @Override
    public String getForUpdateNowaitString(String aliases) {
        return " for update nowait";
    }

    @Override
    public String getForUpdateSkipLockedString() {
        return " for update skip locked";
    }

    @Override
    public String getForUpdateSkipLockedString(String aliases) {
        return " for update skip locked";
    }

    @Override
    public String getReadLockString(int timeout) {
        return " lock in share mode";
    }

    @Override
    public String getReadLockString(String aliases, int timeout) {
        return " lock in share mode";
    }

    @Override
    public String getWriteLockString(int timeout) {
        return " for update";
    }

    @Override
    public String getWriteLockString(String aliases, int timeout) {
        return " for update";
    }
}
