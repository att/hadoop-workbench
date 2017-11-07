package com.directv.hw.persistence.dao

import java.io.InputStream
import java.nio.file._

import com.directv.hw.hadoop.access.KeyTypes.KeyType
import com.directv.hw.hadoop.access.{KeyFile, KeyFileInfo}
import com.directv.hw.hadoop.model.ClusterPath
import com.directv.hw.persistence.entity._
import com.typesafe.scalalogging.LazyLogging

import scala.language.postfixOps
import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend._

trait KeyStoreDao {
  def deletePrivateKeys(clusterPath: ClusterPath, user: String): Unit
  def deleteKeys(clusterPath: ClusterPath): Unit
  def deleteByName(name: String): Unit
  def getById(id: Int): (KeyFile, Path)
  def getLoginKeyByRealm(owner: String, realm: String, `type`: KeyType): Option[(KeyFile, Path)]
  def getKeys(`type`: KeyType,
              owner: Option[String] = None,
              platformId: Option[Int] = None,
              clusterId: Option[String] = None): List[KeyFile]

  def addKey(entity: KeyFile, input: InputStream): Int
  def updateKey(key: KeyFileInfo): Unit
  def deleteKey(id: Int): Unit
}

class KeyStoreDaoImpl(driver: JdbcProfile, db: Database, keyRepo: String) extends KeyStoreDao with LazyLogging {

  private val repoPath = Paths.get(keyRepo)
  private val keyTable = new KeyStoreTable(driver)

  import keyTable._
  import keyTable.driver.simple._

  private val keyQuery = keyTable.query

  override def getById(id: Int): (KeyFile, Path) = {
    db.withSession { implicit session =>
      val info = keyQuery.filter(key => key.id === id).first
      val path = resolvePath(id, info.platformId, info.clusterId)
      (info, path)
    }
  }

  private def resolvePath(id: Int, platformId: Option[Int], clusterId: Option[String]): Path = {
    val dir = platformId.map(id => repoPath.resolve(String.valueOf(id)))
      .map(path => clusterId.map(path.resolve).getOrElse(path))
      .getOrElse(repoPath)

    Files.createDirectories(dir)
    dir.resolve(id.toString + ".keytab")
  }

  override def getKeys(`type`: KeyType,
                       owner: Option[String],
                       platformId: Option[Int],
                       clusterId: Option[String]): List[KeyFile] = {

    db.withSession { implicit session =>
      val ownerQuery = owner.map(_ => keyQuery.filter(_.owner === owner))
        .getOrElse(keyQuery.filter(_.owner.isEmpty))

      val platformQuery = platformId.map(_ => ownerQuery.filter(_.platformId === platformId))
        .getOrElse(ownerQuery.filter(_.platformId.isEmpty))

      val clusterQuery = clusterId.map(_ => platformQuery.filter(_.clusterId === clusterId))
        .getOrElse(platformQuery.filter(_.clusterId.isEmpty))

      clusterQuery.filter(_.`type` === `type`).list
    }
  }

  override def addKey(entity: KeyFile, input: InputStream): Int = db.withTransaction { implicit session =>
    val id = keyQuery returning keyQuery.map(_.id) += entity
    Files.copy(input, resolvePath(id, entity.platformId, entity.clusterId), StandardCopyOption.REPLACE_EXISTING)
    id
  }

  override def updateKey(key: KeyFileInfo): Unit = {
    db.withSession { implicit session =>
      keyQuery.filter(_.id === key.id)
        .map(x => x.name)
        .update(key.name)
    }
  }

  override def deleteKey(id: Int): Unit = {
    db.withTransaction { implicit session =>
      query.filter(_.id === id).firstOption.foreach { k =>
        keyTable.delete(id)
        val path = resolvePath(id, k.platformId, k.clusterId)
        Files.delete(path)
      }
    }
  }

  override def deleteByName(name: String): Unit = {
    db.withTransaction { implicit session =>
      query.filter(_.name === name).foreach { k =>
        keyTable.delete(k.id.get)
        val path = resolvePath(k.id.get, k.platformId, k.clusterId)
        Files.delete(path)
      }
    }
  }

  override def getLoginKeyByRealm(owner: String, realm: String, `type`: KeyType): Option[(KeyFile, Path)] = {
    db.withTransaction { implicit session =>
      val ownerOpt: Option[String] = Some(owner)
      keyQuery.filter { key =>
        key.owner === ownerOpt && key.name === s"$owner@$realm" && key.`type` === `type`
      }.list.headOption.map { key =>
        (key, resolvePath(key.id.get, None, None))
      }
    }
  }

  override def deletePrivateKeys(clusterPath: ClusterPath, user: String): Unit = {
    db.withTransaction { implicit session =>
      query.filter { key =>
        key.owner === Some(user).asInstanceOf[Option[String]] &&
          key.platformId === Some(clusterPath.platformId).asInstanceOf[Option[Int]] &&
          key.clusterId === Some(clusterPath.clusterId).asInstanceOf[Option[String]]
      }.foreach { k =>
        keyTable.delete(k.id.get)
        val path = resolvePath(k.id.get, k.platformId, k.clusterId)
        Files.delete(path)
      }
    }
  }

  override def deleteKeys(clusterPath: ClusterPath): Unit = {
    db.withTransaction { implicit session =>
      query.filter { key =>
        key.platformId === Some(clusterPath.platformId).asInstanceOf[Option[Int]] &&
          key.clusterId === Some(clusterPath.clusterId).asInstanceOf[Option[String]]
      }.foreach { k =>
        keyTable.delete(k.id.get)
        val path = resolvePath(k.id.get, k.platformId, k.clusterId)
        Files.delete(path)
      }
    }
  }
}
