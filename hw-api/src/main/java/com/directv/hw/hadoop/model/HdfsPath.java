package com.directv.hw.hadoop.model;

public class HdfsPath extends ClusterPath {

    String path;

    public HdfsPath(int platformId, String clusterId, String path) {
        super(platformId, clusterId);
        this.path = path;
    }

    public String path() {
        return path;
    }
}
