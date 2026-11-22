plugins {
  alias(libs.plugins.kotlin.jvm)
  alias(libs.plugins.kotlin.serialization)
}

kotlin { jvmToolchain(17) }

dependencies {
  api(libs.kotlinx.serialization.json)
  testImplementation(libs.junit)
}

// The golden cases and the content live in the monorepo's shared/ folder.
tasks.test {
  systemProperty("shared.dir", rootProject.file("../shared").absolutePath)
  inputs.dir(rootProject.file("../shared"))
}
