class PhoneFactory {
    createOS(){
        throw new Error('不允许直接调用')
    }

    createHardWare() {
        throw new Error('不允许直接调用')
    }
}