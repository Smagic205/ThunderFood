package com.thunderfood.backend.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SoldCountFormatterTest {

    @Test
    void testFormatSoldCount() {
        assertEquals("0", SoldCountFormatter.format(null));
        assertEquals("0", SoldCountFormatter.format(0));
        assertEquals("0", SoldCountFormatter.format(-5));
        assertEquals("1", SoldCountFormatter.format(1));
        assertEquals("890", SoldCountFormatter.format(890));
        assertEquals("999", SoldCountFormatter.format(999));
        assertEquals("1k", SoldCountFormatter.format(1000));
        assertEquals("3,4k", SoldCountFormatter.format(3400));
        assertEquals("4k", SoldCountFormatter.format(4000));
        assertEquals("4,1k", SoldCountFormatter.format(4100));
        assertEquals("10k", SoldCountFormatter.format(10000));
        assertEquals("15,4k", SoldCountFormatter.format(15400));
        assertEquals("1tr", SoldCountFormatter.format(1000000));
        assertEquals("1,2tr", SoldCountFormatter.format(1200000));
    }
}
