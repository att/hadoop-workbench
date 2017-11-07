package com.directv.hw.hadoop.model;

public class PlatformPath {
    protected int platformId;

    public PlatformPath(int platformId) {
        this.platformId = platformId;
    }

    public int platformId() {
        return platformId;
    }

    @Override
    public String toString() {
        return String.valueOf(platformId);
    }

    @Override
    public boolean equals(Object obj) { return obj instanceof PlatformPath && platformId == ((PlatformPath) obj).platformId(); }

    @Override
    public int hashCode() { return platformId; }
}
