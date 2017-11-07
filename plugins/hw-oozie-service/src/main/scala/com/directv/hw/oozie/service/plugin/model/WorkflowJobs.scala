package com.directv.hw.oozie.service.plugin.model

import java.util

case class Jobs(offset: Int,
                len: Int,
                total: Int,
                workflows: util.List[WorkflowJob],
                coordinatorjobs: util.List[CoordinatorJob])



