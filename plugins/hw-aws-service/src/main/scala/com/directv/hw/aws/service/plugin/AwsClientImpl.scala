package com.directv.hw.aws.service.plugin

import java.io.InputStream
import java.nio.file.Path

import com.amazonaws.auth.{AWSStaticCredentialsProvider, BasicAWSCredentials}
import com.amazonaws.services.s3.{AmazonS3, AmazonS3ClientBuilder}
import com.amazonaws.services.s3.model.{GetObjectRequest, ObjectMetadata}
import com.directv.hw.hadoop.aws.AwsClient

import scala.collection.JavaConversions._

class AwsClientImpl(accessKey: String, secretKey: String, region: String) extends AwsClient {

  private val s3Client = buildS3Client()

  override def getObjectAsStream(bucket: String, key: String): InputStream = {
    val request = new GetObjectRequest(bucket, key)
    s3Client.getObject(request).getObjectContent
  }

  override def getObjects(bucket: String): List[String] = {

    s3Client.listObjects(bucket).getObjectSummaries.toList.map(_.getKey)
  }

  private def buildS3Client(): AmazonS3 = {
    val awsCreds = new BasicAWSCredentials(accessKey, secretKey)
    AmazonS3ClientBuilder.standard
      .withRegion(region)
      .withCredentials(new AWSStaticCredentialsProvider(awsCreds))
      .build
  }

  override def uploadObject(bucket: String, key: String, path: Path): Unit = {
    s3Client.putObject(bucket, key, path.toFile)
  }

  override def uploadObject(bucket: String, key: String, input: InputStream): Unit = {
    s3Client.putObject(bucket, key, input, new ObjectMetadata)
  }
}
