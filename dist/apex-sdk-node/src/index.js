import { ApexClient as ApexClientPro, ApexClientV2 } from './pro/ApexClient';
import { ApexClientOmni } from './omni/ApexClient';
import { ENV, PROD, QA } from './pro/Constant';
import { ENV as OmniENV, PROD as OMNI_PROD, QA as OMNI_QA } from './omni/Constant';
class ApexClient extends ApexClientPro {
    static createOmniClient(env = OMNI_PROD) {
        return new ApexClientOmni(env);
    }
}
ApexClient.omni = ApexClientOmni;
ApexClient.OMNI_ENV = {
    PROD: OMNI_PROD,
    QA: OMNI_QA
};
export { ApexClient, ApexClientV2, ApexClientOmni };
export { ENV, PROD, QA };
export { OmniENV, OMNI_PROD, OMNI_QA };
export * from './pro';
