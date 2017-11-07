package com.directv.hw.hadoop.model;

public class ServicePath extends ClusterPath {

    private final String serviceId;

    public ServicePath(int platformId, String clusterId, String serviceId) {
        super(platformId, clusterId);
        this.serviceId = serviceId;
    }

    public ServicePath(ClusterPath clusterPath, String serviceId) {
        super(clusterPath.platformId(), clusterPath.clusterId());
        this.serviceId = serviceId;
    }

    public String serviceId() {
        return serviceId;
    }

    public RelativeServicePath relativeServicePath() {
        return new RelativeServicePath(clusterId(), serviceId);
    }

    @Override
    public String toString() {
        return super.toString() + "/" + serviceId;
    }

    @Override
    public boolean equals(Object obj) { return obj instanceof ServicePath && serviceId.equals(((ServicePath) obj).serviceId()) && super.equals(obj);}

    @Override
    public int hashCode() { return serviceId.hashCode() + 31 * super.hashCode(); }
}
