package com.thunderfood.backend.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class SoldCountFormatter {

    private SoldCountFormatter() {}

    public static String format(Integer count) {
        if (count == null || count <= 0) {
            return "0";
        }
        if (count < 1000) {
            return String.valueOf(count);
        }
        if (count < 1_000_000) {
            if (count % 1000 == 0) {
                return (count / 1000) + "k";
            }
            double val = count / 1000.0;
            BigDecimal bd = BigDecimal.valueOf(val).setScale(1, RoundingMode.HALF_UP);
            if (bd.stripTrailingZeros().scale() <= 0) {
                return bd.intValue() + "k";
            }
            return bd.toString().replace('.', ',') + "k";
        }

        if (count % 1_000_000 == 0) {
            return (count / 1_000_000) + "tr";
        }
        double val = count / 1_000_000.0;
        BigDecimal bd = BigDecimal.valueOf(val).setScale(1, RoundingMode.HALF_UP);
        if (bd.stripTrailingZeros().scale() <= 0) {
            return bd.intValue() + "tr";
        }
        return bd.toString().replace('.', ',') + "tr";
    }
}
