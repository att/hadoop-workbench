package com.directv.hw.hadoop.model;

public class ClusterPath extends PlatformPath {

    private String clusterId;

    public ClusterPath(int platformId, String clusterId) {
        super(platformId);
        this.clusterId = clusterId;
    }

    public String clusterId() {
        return clusterId;
    }

    @Override
    public String toString() {
        return super.toString() + "/" + clusterId;
    }

    @Override
    public boolean equals(Object obj) {
        return obj instanceof ClusterPath && clusterId.equals(((ClusterPath) obj).clusterId()) && super.equals(obj);
    }

    public HdfsPath toHdfsPath(String path) {
        return new HdfsPath(platformId, clusterId, path);
    }

    @Override
    public int hashCode() {
        return clusterId.hashCode() + 31 * super.hashCode();
    }
}
