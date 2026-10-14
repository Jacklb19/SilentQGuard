// Original file: packages/contracts/acoustic.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { Empty as _google_protobuf_Empty, Empty__Output as _google_protobuf_Empty__Output } from '../../../google/protobuf/Empty';
import type { GetSpaceRequest as _silentradar_acoustic_v1_GetSpaceRequest, GetSpaceRequest__Output as _silentradar_acoustic_v1_GetSpaceRequest__Output } from '../../../silentradar/acoustic/v1/GetSpaceRequest';
import type { GetSpaceResponse as _silentradar_acoustic_v1_GetSpaceResponse, GetSpaceResponse__Output as _silentradar_acoustic_v1_GetSpaceResponse__Output } from '../../../silentradar/acoustic/v1/GetSpaceResponse';
import type { SnapshotEvent as _silentradar_acoustic_v1_SnapshotEvent, SnapshotEvent__Output as _silentradar_acoustic_v1_SnapshotEvent__Output } from '../../../silentradar/acoustic/v1/SnapshotEvent';
import type { SpaceSnapshot as _silentradar_acoustic_v1_SpaceSnapshot, SpaceSnapshot__Output as _silentradar_acoustic_v1_SpaceSnapshot__Output } from '../../../silentradar/acoustic/v1/SpaceSnapshot';
import type { SubmitReportRequest as _silentradar_acoustic_v1_SubmitReportRequest, SubmitReportRequest__Output as _silentradar_acoustic_v1_SubmitReportRequest__Output } from '../../../silentradar/acoustic/v1/SubmitReportRequest';
import type { SubmitReportResponse as _silentradar_acoustic_v1_SubmitReportResponse, SubmitReportResponse__Output as _silentradar_acoustic_v1_SubmitReportResponse__Output } from '../../../silentradar/acoustic/v1/SubmitReportResponse';

export interface AcousticServiceClient extends grpc.Client {
  GetSpace(argument: _silentradar_acoustic_v1_GetSpaceRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_silentradar_acoustic_v1_GetSpaceResponse__Output>): grpc.ClientUnaryCall;
  GetSpace(argument: _silentradar_acoustic_v1_GetSpaceRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_silentradar_acoustic_v1_GetSpaceResponse__Output>): grpc.ClientUnaryCall;
  GetSpace(argument: _silentradar_acoustic_v1_GetSpaceRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_silentradar_acoustic_v1_GetSpaceResponse__Output>): grpc.ClientUnaryCall;
  GetSpace(argument: _silentradar_acoustic_v1_GetSpaceRequest, callback: grpc.requestCallback<_silentradar_acoustic_v1_GetSpaceResponse__Output>): grpc.ClientUnaryCall;
  getSpace(argument: _silentradar_acoustic_v1_GetSpaceRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_silentradar_acoustic_v1_GetSpaceResponse__Output>): grpc.ClientUnaryCall;
  getSpace(argument: _silentradar_acoustic_v1_GetSpaceRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_silentradar_acoustic_v1_GetSpaceResponse__Output>): grpc.ClientUnaryCall;
  getSpace(argument: _silentradar_acoustic_v1_GetSpaceRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_silentradar_acoustic_v1_GetSpaceResponse__Output>): grpc.ClientUnaryCall;
  getSpace(argument: _silentradar_acoustic_v1_GetSpaceRequest, callback: grpc.requestCallback<_silentradar_acoustic_v1_GetSpaceResponse__Output>): grpc.ClientUnaryCall;

  ListSpaces(argument: _google_protobuf_Empty, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_silentradar_acoustic_v1_SpaceSnapshot__Output>): grpc.ClientUnaryCall;
  ListSpaces(argument: _google_protobuf_Empty, metadata: grpc.Metadata, callback: grpc.requestCallback<_silentradar_acoustic_v1_SpaceSnapshot__Output>): grpc.ClientUnaryCall;
  ListSpaces(argument: _google_protobuf_Empty, options: grpc.CallOptions, callback: grpc.requestCallback<_silentradar_acoustic_v1_SpaceSnapshot__Output>): grpc.ClientUnaryCall;
  ListSpaces(argument: _google_protobuf_Empty, callback: grpc.requestCallback<_silentradar_acoustic_v1_SpaceSnapshot__Output>): grpc.ClientUnaryCall;
  listSpaces(argument: _google_protobuf_Empty, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_silentradar_acoustic_v1_SpaceSnapshot__Output>): grpc.ClientUnaryCall;
  listSpaces(argument: _google_protobuf_Empty, metadata: grpc.Metadata, callback: grpc.requestCallback<_silentradar_acoustic_v1_SpaceSnapshot__Output>): grpc.ClientUnaryCall;
  listSpaces(argument: _google_protobuf_Empty, options: grpc.CallOptions, callback: grpc.requestCallback<_silentradar_acoustic_v1_SpaceSnapshot__Output>): grpc.ClientUnaryCall;
  listSpaces(argument: _google_protobuf_Empty, callback: grpc.requestCallback<_silentradar_acoustic_v1_SpaceSnapshot__Output>): grpc.ClientUnaryCall;

  SubmitReport(argument: _silentradar_acoustic_v1_SubmitReportRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_silentradar_acoustic_v1_SubmitReportResponse__Output>): grpc.ClientUnaryCall;
  SubmitReport(argument: _silentradar_acoustic_v1_SubmitReportRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_silentradar_acoustic_v1_SubmitReportResponse__Output>): grpc.ClientUnaryCall;
  SubmitReport(argument: _silentradar_acoustic_v1_SubmitReportRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_silentradar_acoustic_v1_SubmitReportResponse__Output>): grpc.ClientUnaryCall;
  SubmitReport(argument: _silentradar_acoustic_v1_SubmitReportRequest, callback: grpc.requestCallback<_silentradar_acoustic_v1_SubmitReportResponse__Output>): grpc.ClientUnaryCall;
  submitReport(argument: _silentradar_acoustic_v1_SubmitReportRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_silentradar_acoustic_v1_SubmitReportResponse__Output>): grpc.ClientUnaryCall;
  submitReport(argument: _silentradar_acoustic_v1_SubmitReportRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_silentradar_acoustic_v1_SubmitReportResponse__Output>): grpc.ClientUnaryCall;
  submitReport(argument: _silentradar_acoustic_v1_SubmitReportRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_silentradar_acoustic_v1_SubmitReportResponse__Output>): grpc.ClientUnaryCall;
  submitReport(argument: _silentradar_acoustic_v1_SubmitReportRequest, callback: grpc.requestCallback<_silentradar_acoustic_v1_SubmitReportResponse__Output>): grpc.ClientUnaryCall;

  WatchSpaces(argument: _google_protobuf_Empty, metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientReadableStream<_silentradar_acoustic_v1_SnapshotEvent__Output>;
  WatchSpaces(argument: _google_protobuf_Empty, options?: grpc.CallOptions): grpc.ClientReadableStream<_silentradar_acoustic_v1_SnapshotEvent__Output>;
  watchSpaces(argument: _google_protobuf_Empty, metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientReadableStream<_silentradar_acoustic_v1_SnapshotEvent__Output>;
  watchSpaces(argument: _google_protobuf_Empty, options?: grpc.CallOptions): grpc.ClientReadableStream<_silentradar_acoustic_v1_SnapshotEvent__Output>;

}

export interface AcousticServiceHandlers extends grpc.UntypedServiceImplementation {
  GetSpace: grpc.handleUnaryCall<_silentradar_acoustic_v1_GetSpaceRequest__Output, _silentradar_acoustic_v1_GetSpaceResponse>;

  ListSpaces: grpc.handleUnaryCall<_google_protobuf_Empty__Output, _silentradar_acoustic_v1_SpaceSnapshot>;

  SubmitReport: grpc.handleUnaryCall<_silentradar_acoustic_v1_SubmitReportRequest__Output, _silentradar_acoustic_v1_SubmitReportResponse>;

  WatchSpaces: grpc.handleServerStreamingCall<_google_protobuf_Empty__Output, _silentradar_acoustic_v1_SnapshotEvent>;

}

export interface AcousticServiceDefinition extends grpc.ServiceDefinition {
  GetSpace: MethodDefinition<_silentradar_acoustic_v1_GetSpaceRequest, _silentradar_acoustic_v1_GetSpaceResponse, _silentradar_acoustic_v1_GetSpaceRequest__Output, _silentradar_acoustic_v1_GetSpaceResponse__Output>
  ListSpaces: MethodDefinition<_google_protobuf_Empty, _silentradar_acoustic_v1_SpaceSnapshot, _google_protobuf_Empty__Output, _silentradar_acoustic_v1_SpaceSnapshot__Output>
  SubmitReport: MethodDefinition<_silentradar_acoustic_v1_SubmitReportRequest, _silentradar_acoustic_v1_SubmitReportResponse, _silentradar_acoustic_v1_SubmitReportRequest__Output, _silentradar_acoustic_v1_SubmitReportResponse__Output>
  WatchSpaces: MethodDefinition<_google_protobuf_Empty, _silentradar_acoustic_v1_SnapshotEvent, _google_protobuf_Empty__Output, _silentradar_acoustic_v1_SnapshotEvent__Output>
}
