package com.directv.hw.hadoop.model;

public class RelativeServicePath {

    private String clusterId;
    private String serviceId;

    public RelativeServicePath(String clusterId, String serviceId) {
        this.clusterId = clusterId;
        this.serviceId = serviceId;
    }

    public String clusterId() {
        return clusterId;
    }

    public String serviceId() {
        return serviceId;
    }

    @Override
    public String toString() {
        return "ServiceId: " + serviceId + ", ClusterId: " + clusterId;
    }
}
