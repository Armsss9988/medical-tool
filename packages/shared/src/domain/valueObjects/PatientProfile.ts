import { Gender, Patient } from '../types';
import { PatientCode } from './PatientCode';
import { SecretToken } from './SecretToken';
import { SampleStatusVO } from './SampleStatusVO';

export class PatientProfile {
  private readonly _code: string;
  private readonly _secretToken: string;
  private readonly _name: string;
  private readonly _dob: string;
  private readonly _gender: Gender;
  private readonly _phone: string;
  private readonly _address: string;
  private readonly _diagnosis: string;
  private readonly _doctor: string;
  private readonly _sampleCode: string;
  private readonly _sampleStatus: SampleStatusVO;
  private readonly _orderedAt?: string;
  private readonly _receivedAt?: string;
  private readonly _returnedAt?: string;
  private readonly _paidAt?: string;

  private constructor(params: {
    code: string;
    secretToken: string;
    name: string;
    dob: string;
    gender: Gender;
    phone: string;
    address: string;
    diagnosis: string;
    doctor?: string;
    sampleCode?: string;
    sampleStatus?: SampleStatusVO;
    orderedAt?: string;
    receivedAt?: string;
    returnedAt?: string;
    paidAt?: string;
  }) {
    this._code = params.code.trim();
    this._secretToken = params.secretToken;
    this._name = params.name.trim();
    this._dob = params.dob.trim();
    this._gender = params.gender;
    this._phone = params.phone.trim();
    this._address = params.address.trim();
    this._diagnosis = params.diagnosis.trim();
    this._doctor = (params.doctor || '').trim();
    this._sampleCode = (params.sampleCode || params.code).trim();
    this._sampleStatus = params.sampleStatus || SampleStatusVO.ACCEPTED;
    this._orderedAt = params.orderedAt;
    this._receivedAt = params.receivedAt;
    this._returnedAt = params.returnedAt;
    this._paidAt = params.paidAt;
  }

  public static create(params?: Partial<Patient>): PatientProfile {
    const rawCode = params?.code?.trim() || PatientCode.create().value;
    const token = params?.secretToken || SecretToken.create().value;

    return new PatientProfile({
      code: rawCode,
      secretToken: token,
      name: params?.name || '',
      dob: params?.dob || '',
      gender: params?.gender || 'Nam',
      phone: params?.phone || '',
      address: params?.address || '',
      diagnosis: params?.diagnosis || '',
      doctor: params?.doctor || '',
      sampleCode: params?.sampleCode || rawCode,
      sampleStatus: SampleStatusVO.from(params?.sampleStatus),
      orderedAt: params?.orderedAt,
      receivedAt: params?.receivedAt,
      returnedAt: params?.returnedAt,
      paidAt: params?.paidAt
    });
  }

  public static from(patient: Patient): PatientProfile {
    return PatientProfile.create(patient);
  }

  public withUpdates(updates: Partial<Patient>): PatientProfile {
    return new PatientProfile({
      code: updates.code !== undefined ? updates.code : this._code,
      secretToken: updates.secretToken !== undefined ? updates.secretToken : this._secretToken,
      name: updates.name !== undefined ? updates.name : this._name,
      dob: updates.dob !== undefined ? updates.dob : this._dob,
      gender: updates.gender !== undefined ? updates.gender : this._gender,
      phone: updates.phone !== undefined ? updates.phone : this._phone,
      address: updates.address !== undefined ? updates.address : this._address,
      diagnosis: updates.diagnosis !== undefined ? updates.diagnosis : this._diagnosis,
      doctor: updates.doctor !== undefined ? updates.doctor : this._doctor,
      sampleCode: updates.sampleCode !== undefined ? updates.sampleCode : this._sampleCode,
      sampleStatus: updates.sampleStatus !== undefined ? SampleStatusVO.from(updates.sampleStatus) : this._sampleStatus,
      orderedAt: 'orderedAt' in updates ? updates.orderedAt : this._orderedAt,
      receivedAt: 'receivedAt' in updates ? updates.receivedAt : this._receivedAt,
      returnedAt: 'returnedAt' in updates ? updates.returnedAt : this._returnedAt,
      paidAt: 'paidAt' in updates ? updates.paidAt : this._paidAt
    });
  }

  public equals(other: PatientProfile): boolean {
    if (!other) return false;
    return (
      this._code === other._code &&
      this._name === other._name &&
      this._dob === other._dob &&
      this._gender === other._gender &&
      this._phone === other._phone &&
      this._address === other._address &&
      this._diagnosis === other._diagnosis &&
      this._doctor === other._doctor &&
      this._sampleCode === other._sampleCode &&
      this._sampleStatus.value === other._sampleStatus.value
    );
  }

  public toSnapshot(): Patient {
    return {
      code: this._code,
      secretToken: this._secretToken,
      name: this._name,
      dob: this._dob,
      gender: this._gender,
      phone: this._phone,
      address: this._address,
      diagnosis: this._diagnosis,
      doctor: this._doctor || undefined,
      sampleCode: this._sampleCode,
      sampleStatus: this._sampleStatus.value,
      orderedAt: this._orderedAt,
      receivedAt: this._receivedAt,
      returnedAt: this._returnedAt,
      paidAt: this._paidAt
    };
  }

  // Getters
  public get code(): string { return this._code; }
  public get secretToken(): string { return this._secretToken; }
  public get name(): string { return this._name; }
  public get dob(): string { return this._dob; }
  public get gender(): Gender { return this._gender; }
  public get phone(): string { return this._phone; }
  public get address(): string { return this._address; }
  public get diagnosis(): string { return this._diagnosis; }
  public get doctor(): string { return this._doctor; }
  public get sampleCode(): string { return this._sampleCode; }
  public get sampleStatus(): SampleStatusVO { return this._sampleStatus; }
  public get orderedAt(): string | undefined { return this._orderedAt; }
  public get receivedAt(): string | undefined { return this._receivedAt; }
  public get returnedAt(): string | undefined { return this._returnedAt; }
  public get paidAt(): string | undefined { return this._paidAt; }
}
