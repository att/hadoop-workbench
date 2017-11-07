import {FILE_WORKFLOW_XML, FILE_CONFIG_DEFAULT_XML, FILE_COORDINATOR_XML, FILE_COORDINATOR_CONFIG_XML} from '../constants/file-names'
export const defaultWorkflowFileObject = {
    modificationTime: 0,
    size: 1,
    path: '/' + FILE_WORKFLOW_XML,
    type: 'file'// @TODO : verify file type REST returns type as "file" and not "workflow"
};

export const defaultConfigFileObject = {
    modificationTime: 0,
    size: 1,
    path: '/' + FILE_CONFIG_DEFAULT_XML,
    type: 'file'
};

export const defaultCoordinatorFileObject = {
    modificationTime: 0,
    size: 1,
    path: '/' + FILE_COORDINATOR_XML,
    type: 'file'
};

export const defaultCoordinatorConfigFileObject = {
    modificationTime: 0,
    size: 1,
    path: '/' + FILE_COORDINATOR_CONFIG_XML,
    type: 'file'
};

export function oozieComponentFilesWrapper(component) {
    if (component && (component.files === undefined)) {
        component.files = [defaultWorkflowFileObject, defaultConfigFileObject, defaultCoordinatorConfigFileObject];
        component.isFilesWrapped = true;
    }
    return component;
}

export function oozieComponentFilesWrapperRelease(component) {
    if (component) {
        component.isFilesWrapped = false;
    }
    return component;
}
