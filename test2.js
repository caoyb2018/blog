function getPrice(id) {
    return fetch(`xxx.com?id=${id}`).then((res) => res.price)
}

async function getTotalPrice(id1, id2) {
    const p1 = await getPrice(id1);
    const p2 = await getPrice(id2);
    return p1+p2; 
}

async function run() {
    await getTotalPrice('001', '002')
}

function getPrice(id) {
    const p = perform id;
    return p;
}

function getTotalPrice(id1, id2) {
    return getPrice(id1) + getPrice(id2)
}

try {
    getTotalPrice('001', '002')
}handle(id) {
    fetch(`xxx.com?id=${id}`).then(res => {
        resume with res.price
    })
}