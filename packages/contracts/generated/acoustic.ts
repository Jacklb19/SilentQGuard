import type * as grpc from '@grpc/grpc-js';
import type { EnumTypeDefinition, MessageTypeDefinition } from '@grpc/proto-loader';

import type { Empty as _google_protobuf_Empty, Empty__Output as _google_protobuf_Empty__Output } from './google/protobuf/Empty';
import type { Timestamp as _google_protobuf_Timestamp, Timestamp__Output as _google_protobuf_Timestamp__Output } from './google/protobuf/Timestamp';
import type { AcousticServiceClient as _silentradar_acoustic_v1_AcousticServiceClient, AcousticServiceDefinition as _silentradar_acoustic_v1_AcousticServiceDefinition } from './silentradar/acoustic/v1/AcousticService';
import type { GetSpaceRequest as _silentradar_acoustic_v1_GetSpaceRequest, GetSpaceRequest__Output as _silentradar_acoustic_v1_GetSpaceRequest__Output } from './silentradar/acoustic/v1/GetSpaceRequest';
import type { GetSpaceResponse as _silentradar_acoustic_v1_GetSpaceResponse, GetSpaceResponse__Output as _silentradar_acoustic_v1_GetSpaceResponse__Output } from './silentradar/acoustic/v1/GetSpaceResponse';
import type { Report as _silentradar_acoustic_v1_Report, Report__Output as _silentradar_acoustic_v1_Report__Output } from './silentradar/acoustic/v1/Report';
import type { SnapshotEvent as _silentradar_acoustic_v1_SnapshotEvent, SnapshotEvent__Output as _silentradar_acoustic_v1_SnapshotEvent__Output } from './silentradar/acoustic/v1/SnapshotEvent';
import type { Space as _silentradar_acoustic_v1_Space, Space__Output as _silentradar_acoustic_v1_Space__Output } from './silentradar/acoustic/v1/Space';
import type { SpaceSnapshot as _silentradar_acoustic_v1_SpaceSnapshot, SpaceSnapshot__Output as _silentradar_acoustic_v1_SpaceSnapshot__Output } from './silentradar/acoustic/v1/SpaceSnapshot';
import type { SubmitReportRequest as _silentradar_acoustic_v1_SubmitReportRequest, SubmitReportRequest__Output as _silentradar_acoustic_v1_SubmitReportRequest__Output } from './silentradar/acoustic/v1/SubmitReportRequest';
import type { SubmitReportResponse as _silentradar_acoustic_v1_SubmitReportResponse, SubmitReportResponse__Output as _silentradar_acoustic_v1_SubmitReportResponse__Output } from './silentradar/acoustic/v1/SubmitReportResponse';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  google: {
    protobuf: {
      Empty: MessageTypeDefinition<_google_protobuf_Empty, _google_protobuf_Empty__Output>
      Timestamp: MessageTypeDefinition<_google_protobuf_Timestamp, _google_protobuf_Timestamp__Output>
    }
  }
  silentradar: {
    acoustic: {
      v1: {
        AcousticService: SubtypeConstructor<typeof grpc.Client, _silentradar_acoustic_v1_AcousticServiceClient> & { service: _silentradar_acoustic_v1_AcousticServiceDefinition }
        AcousticStatus: EnumTypeDefinition
        GetSpaceRequest: MessageTypeDefinition<_silentradar_acoustic_v1_GetSpaceRequest, _silentradar_acoustic_v1_GetSpaceRequest__Output>
        GetSpaceResponse: MessageTypeDefinition<_silentradar_acoustic_v1_GetSpaceResponse, _silentradar_acoustic_v1_GetSpaceResponse__Output>
        Report: MessageTypeDefinition<_silentradar_acoustic_v1_Report, _silentradar_acoustic_v1_Report__Output>
        SnapshotEvent: MessageTypeDefinition<_silentradar_acoustic_v1_SnapshotEvent, _silentradar_acoustic_v1_SnapshotEvent__Output>
        SnapshotReason: EnumTypeDefinition
        Space: MessageTypeDefinition<_silentradar_acoustic_v1_Space, _silentradar_acoustic_v1_Space__Output>
        SpaceSnapshot: MessageTypeDefinition<_silentradar_acoustic_v1_SpaceSnapshot, _silentradar_acoustic_v1_SpaceSnapshot__Output>
        SubmitReportRequest: MessageTypeDefinition<_silentradar_acoustic_v1_SubmitReportRequest, _silentradar_acoustic_v1_SubmitReportRequest__Output>
        SubmitReportResponse: MessageTypeDefinition<_silentradar_acoustic_v1_SubmitReportResponse, _silentradar_acoustic_v1_SubmitReportResponse__Output>
      }
    }
  }
}
