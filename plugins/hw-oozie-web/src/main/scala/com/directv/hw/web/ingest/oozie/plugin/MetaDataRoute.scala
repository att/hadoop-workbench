package com.directv.hw.web.ingest.oozie.plugin

import com.directv.hw.common.web.WebCommon
import com.directv.hw.hadoop.oozie.service.OozieMetaDataService
import spray.routing._

trait MetaDataRoute {
  self: WebCommon =>

  protected val metaDataService: OozieMetaDataService

  private[plugin] def metadataRoute: Route = {
    pathPrefix("subtypes") {
      path(Segment) { workflowVersion =>
        completeJsonResponse(metaDataService.getSubtypeMetadata(workflowVersion))
      }
    } ~
    pathPrefix("types") {
      path(Segment) { workflowVersion =>
        completeJsonResponse(metaDataService.getTypeMetadata(workflowVersion))
      }
    } ~
    pathPrefix("connections") {
      path(Segment) { workflowVersion =>
        completeJsonResponse(metaDataService.getConnectionsMetadata(workflowVersion))
      }
    }
  }
}
