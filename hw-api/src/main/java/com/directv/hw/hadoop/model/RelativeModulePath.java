package com.directv.hw.hadoop.model;

public class RelativeModulePath extends RelativeServicePath {
    private String moduleId;

    public RelativeModulePath(String clusterId, String serviceId, String moduleId) {
        super(clusterId, serviceId);
        this.moduleId = moduleId;
    }

    public RelativeModulePath(RelativeServicePath relativeServicePath ,String moduleId) {
        super(relativeServicePath.clusterId(), relativeServicePath.serviceId());
        this.moduleId = moduleId;
    }

    public String moduleId() {
        return moduleId;
    }

    public RelativeServicePath getServicePath() {
        return new RelativeServicePath(clusterId(), serviceId());
    }

    @Override
    public String toString()  {
        return super.toString() + ", moduleId=[" + moduleId + "]";
    }
}
