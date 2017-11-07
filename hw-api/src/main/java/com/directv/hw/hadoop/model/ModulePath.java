package com.directv.hw.hadoop.model;

public class ModulePath extends ServicePath {

    private final String moduleId;

    public ModulePath(int platformId, String clusterId, String serviceId, String moduleId) {
        super(platformId, clusterId, serviceId);
        this.moduleId = moduleId;
    }

    public ModulePath(ServicePath servicePath, String moduleId) {
        super(servicePath.platformId(), servicePath.clusterId(), servicePath.serviceId());
        this.moduleId = moduleId;
    }

    public String moduleId() {
        return moduleId;
    }

    public RelativeModulePath relativeModulePath() {
        return new RelativeModulePath(clusterId(), serviceId(), moduleId);
    }

    @Override
    public String toString() {
        return super.toString() + "/" + moduleId;
    }

    @Override
    public boolean equals(Object obj) { return obj instanceof ModulePath && moduleId.equals(((ModulePath) obj).moduleId) && super.equals(obj); }

    @Override
    public int hashCode() { return moduleId.hashCode() + 31 * super.hashCode(); }
}
