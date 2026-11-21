package dev.mmartos.feynmanquest

import dev.mmartos.feynmanquest.core.content.BuildStep
import dev.mmartos.feynmanquest.core.engine.EdgeType
import dev.mmartos.feynmanquest.core.engine.validate
import dev.mmartos.feynmanquest.ui.diagram.ConnectResult
import dev.mmartos.feynmanquest.ui.diagram.connect
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ConnectTest {
  private val step = TestContent.content.level(12)!!.steps.first() as BuildStep
  private val vertices = step.diagram.nodes.filter { !it.isExternal }.map { it.id }

  @Test fun photonBetweenVerticesSolvesLevel12() {
    val r = connect(step.diagram, vertices[0], vertices[1], EdgeType.Photon, allowParallel = false)
    assertTrue(r is ConnectResult.Ok)
    assertTrue(validate((r as ConnectResult.Ok).diagram, step.validation).ok)
  }

  @Test fun externalsCannotBeJoinedDirectly() {
    val ext = step.diagram.nodes.filter { it.isExternal }.map { it.id }
    val r = connect(step.diagram, ext[0], ext[1], EdgeType.Photon, allowParallel = false)
    assertTrue(r is ConnectResult.Denied)
  }

  @Test fun noDuplicateLineWithoutLoops() {
    val once = (connect(step.diagram, vertices[0], vertices[1], EdgeType.Photon, false) as ConnectResult.Ok).diagram
    val twice = connect(once, vertices[0], vertices[1], EdgeType.Photon, false)
    assertEquals(ConnectResult.Denied("Ya hay una línea entre esos dos puntos."), twice)
  }

  @Test fun vertexCapacityIsThree() {
    val d = (connect(step.diagram, vertices[0], vertices[1], EdgeType.Photon, false) as ConnectResult.Ok).diagram
    // Both vertices now have three lines: any further line is refused.
    val ext = d.nodes.first { it.isExternal }.id
    assertTrue(connect(d, vertices[0], ext, EdgeType.Photon, true) is ConnectResult.Denied)
  }
}
