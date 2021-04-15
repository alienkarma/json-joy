import {Model} from '../../Model';
import {ModelSession} from './ModelSession';
import {Picker} from './Picker';
import {FuzzerOptions} from './types';

export const defaultFuzzerOptions: FuzzerOptions = {
  stringDeleteProbability: .2,
  maxStringDeleteLength: 64,
  maxSubstringLength: 16,
  maxStringLength: 512,
  maxConcurrentPeers: 5,
  maxPatchesPerPeer: 10,
};

export class ModelFuzzer {
  public opts: FuzzerOptions;
  public model = new Model();
  public picker: Picker;
  
  constructor(opts: Partial<FuzzerOptions> = {}) {
    this.opts = {...defaultFuzzerOptions, ...opts};
    this.picker = new Picker(this.opts);
  }

  public setupModel() {
    const str = this.picker.generateSubstring();
    this.model.api.root(str).commit();
  }

  public executeConcurrentSession(): ModelSession {
    const concurrency = Math.max(2, Math.ceil(Math.random() * this.opts.maxConcurrentPeers));
    const session = new ModelSession(this, concurrency);
    session.generateEdits();
    session.synchronize();
    return session;
  }
}
