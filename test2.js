import React from 'react';
import { Form, Radio, Button, Input, Select, DatePicker, Checkbox, Col, Cascader, message } from 'antd';
import { cityList } from '@/utils/city';
import { getFormateDate } from '@/utils/common';
import HeadAvatar from './HeadAvatar';
import moment from 'moment';
import TableBlock from './TableBlock/index';
import { formatType, testFormate } from '@/utils/testFormate';

const { Option } = Select;
const { TextArea } = Input;
class BaseForm extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            file: null,
            invalid: false,
            nation: [],  //民族
            culture: [], //文化程度
            religion: [], //宗教信仰
            marry: [], //婚姻状态
            house: [], //居住情况
            medical: [], //医疗费用支付方式
            economics: [], //经济来源
        }
    }

    componentDidMount() {
        const { dispatch } = this.props
        dispatch({
            type: 'bookInsert/getBaseInfo',
            payload: {
                kind: 'nation'
            },
            callback: (res) => {
                if (res.length > 0) {
                    this.setState({
                        nation: res
                    })
                }
            }
        })
        dispatch({
            type: 'bookInsert/getBaseInfo',
            payload: {
                kind: 'culture'
            },
            callback: (res) => {
                if (res.length > 0) {
                    this.setState({
                        culture: res
                    })
                }
            }
        })
        dispatch({
            type: 'bookInsert/getBaseInfo',
            payload: {
                kind: 'religion'
            },
            callback: (res) => {
                if (res.length > 0) {
                    this.setState({
                        religion: res
                    })
                }
            }
        })
        dispatch({
            type: 'bookInsert/getBaseInfo',
            payload: {
                kind: 'marry'
            },
            callback: (res) => {
                if (res.length > 0) {
                    this.setState({
                        marry: res
                    })
                }
            }
        })
        dispatch({
            type: 'bookInsert/getBaseInfo',
            payload: {
                kind: 'house'
            },
            callback: (res) => {
                if (res.length > 0) {
                    this.setState({
                        house: res
                    })
                }
            }
        })
        dispatch({
            type: 'bookInsert/getBaseInfo',
            payload: {
                kind: 'medical'
            },
            callback: (res) => {
                if (res.length > 0) {
                    this.setState({
                        medical: res
                    })
                }
            }
        })
        dispatch({
            type: 'bookInsert/getBaseInfo',
            payload: {
                kind: 'economics'
            },
            callback: (res) => {
                if (res.length > 0) {
                    this.setState({
                        economics: res
                    })
                }
            }
        })
    }

    componentWillUnmount() {
        this.setState = (state, callback) => {
            return
        }
    }

    handleInputId = (rule, value, callback) => {
        const { getFieldValue } = this.props.form;
        if (value && !testFormate(value, formatType.idType) && getFieldValue('idType') === '0') {
            callback('身份证号输入有误')
        }
        callback()
    }

    onIdNumberChanged = (e) => {
        this.props.form.validateFields(['idNumber'], {},
            (err, values) => {
                if (!err) {
                    const {
                        dispatch,
                        basicInfo,
                        loginInfo,
                    } = this.props;
                    dispatch({
                        type: 'bookInsert/getOlders',
                        payload: {
                            search: {
                                idNumber: values.idNumber,
                                powerType: 3
                            },
                            orgId: loginInfo.selectOrg.id,
                        },
                        callback: (res) => {
                            if (undefined === res) {
                                //照护系统无该证件老人信息
                                this.setState({
                                    invalid: true
                                });
                            } else if (res && res.list && res.list.length > 0) {
                                const older = res.list[0];
                                if (older.olderId > 0) {
                                    if (older.olderId !== basicInfo.id) {
                                        message.error('证件号码已存在！', 3.5);
                                        this.setState({
                                            invalid: true
                                        });
                                    }
                                } else {
                                    //使用照护系统老人信息初始化
                                    let tempBasicInfo = Object.assign({}, basicInfo, {
                                        externalId: older.externalId,
                                        name: older.name,
                                        sex: older.sex
                                    });
                                    dispatch({
                                        type: 'bookInsert/updateBasicInfo',
                                        payload: tempBasicInfo
                                    });
                                }
                            } else {
                                this.setState({
                                    invalid: false
                                });
                            }
                        }
                    });
                }
            });
    }

    handleSubmit = e => {
        const { religion, medical, economics } = this.state
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                values.birthday = moment(values.birthday).format('YYYY-MM-DD');
                const { file } = this.state;
                values.imageFile = file;
                //宗教信仰 “其他” 处理
                if (values.religion !== religion[religion.length - 1]) {
                    values.religionOther = '';
                }
                //医疗费用支付方式 “其他” 处理
                const payOtherIndex = values.payType.indexOf(medical[medical.length - 1]);
                if (payOtherIndex > -1) {
                    if (payOtherIndex !== values.payType.length - 1) {
                        values.payType.splice(payOtherIndex, 1);
                        values.payType.push(medical[medical.length - 1]);
                    }
                } else {
                    values.payTypeOther = '';
                }
                //经济来源 “其他” 处理
                if (values.incomeType) {
                    const incomeTypeOtherIndex = values.incomeType.indexOf(economics[economics.length - 1]);
                    if (incomeTypeOtherIndex > -1) {
                        if (incomeTypeOtherIndex !== values.incomeType.length - 1) {
                            values.incomeType.splice(incomeTypeOtherIndex, 1);
                            values.incomeType.push(economics[economics.length - 1]);
                        }
                    } else {
                        values.incomeTypeOther = '';
                    }
                }

                const {
                    dispatch,
                    basicInfo,
                    loginInfo,
                    submit
                } = this.props;
                let tempBasic = Object.assign({}, basicInfo, values);
                delete tempBasic.createTime;
                delete tempBasic.updateTime;
                tempBasic.imageFile = values.imageFile !== null && values.imageFile !== undefined ? values.imageFile.originFileObj : null;
                tempBasic.payType = values.payType.join(',');
                if (values.incomeType) {
                    tempBasic.incomeType = values.incomeType.join(',');
                }
                if (values.address && values.address.length === 3) {
                    tempBasic.province = values.address[0];
                    tempBasic.city = values.address[1];
                    tempBasic.area = values.address[2];
                }
                values = Object.assign({}, basicInfo, values);
                if (basicInfo.id && basicInfo.id > 0) {
                    //编辑
                    dispatch({
                        type: 'bookInsert/updateOlder',
                        payload: {
                            orgId: loginInfo.selectOrg.id,
                            olderId: basicInfo.id,
                            search: tempBasic
                        },
                        callback: () => {
                            dispatch({
                                type: 'bookInsert/updateBasicInfo',
                                payload: values
                            });
                            submit();
                        }
                    });
                } else {
                    //新增
                    dispatch({
                        type: 'bookInsert/addOlder',
                        payload: {
                            orgId: loginInfo.selectOrg.id,
                            search: tempBasic
                        },
                        callback: (response) => {
                            values.id = response;
                            dispatch({
                                type: 'bookInsert/updateBasicInfo',
                                payload: values
                            });
                            dispatch({
                                type: 'bookInsert/updateOlderId',
                                payload: response
                            });
                            submit();
                        }
                    });
                }
            }
        });
    };

    render() {
        const {
            getFieldDecorator,
            getFieldValue
        } = this.props.form;
        const {
            basicInfo
        } = this.props;
        const { nation, culture, religion, marry, house, medical, economics } = this.state
        const formItemLayout = {
            labelCol: {
                xs: { span: 6 },
                sm: { span: 6 },
            },
            wrapperCol: {
                xs: { span: 18 },
                sm: { span: 18 },
            },
        };
        return (
            <TableBlock name='基本信息'>
                <Form {...formItemLayout} onSubmit={this.handleSubmit}>
                    <Form.Item label="姓名">
                        <Col span={6}>
                            {getFieldDecorator('name', {
                                rules: [{
                                    required: true,
                                    message: '姓名不能为空',
                                }],
                                initialValue: basicInfo.name
                            })(
                                <Input />)}
                        </Col>
                    </Form.Item>
                    <Form.Item label="头像">
                        <Col span={6}>
                            <HeadAvatar
                                onChange={(file) => {
                                    this.setState({ file });
                                }}
                                imageUrl={this.state.file == null ? basicInfo.imageFile || basicInfo.image : this.state.file}
                            >
                            </HeadAvatar>
                        </Col>
                    </Form.Item>
                    <Form.Item label="性别">
                        {getFieldDecorator('sex', {
                            rules: [{
                                required: true,
                                message: '请选择性别',
                            }],
                            initialValue: basicInfo.sex || 0

                        })(
                            <Radio.Group >
                                <Radio value={0}>男</Radio>
                                <Radio value={1}>女</Radio>
                            </Radio.Group>,
                        )}
                    </Form.Item>
                    <Form.Item label="民族">
                        <Col span={4}>
                            {getFieldDecorator('nation', {
                                rules: [{
                                    required: true,
                                    message: '请选择民族',
                                }],
                                initialValue: basicInfo.nation
                            })(
                                <Select
                                    placeholder="请选择"
                                    onChange={this.handleMingChange}
                                >
                                    {nation.length > 0 && nation.map((item, index) => {
                                        return (
                                            <Option key={index} value={item}>{item}</Option>
                                        )
                                    })}
                                </Select>
                            )}
                        </Col>
                    </Form.Item>
                    <Form.Item label="证件类型">
                        <Col span={4}>
                            {getFieldDecorator('idType', {
                                rules: [{ required: true, message: '请选择证件类型' }],
                                initialValue: basicInfo.idType
                            })(
                                <Select
                                    placeholder="请选择"
                                >
                                    <Option value={0}>身份证</Option>
                                    <Option value={1}>其他</Option>
                                </Select>
                            )}
                        </Col>
                    </Form.Item>
                    {getFieldValue('idType') != undefined ?
                        (<Form.Item label="证件号码">
                            <Col span={10} >
                                {getFieldDecorator('idNumber', {
                                    rules: [{ required: true, message: '证件号码不能为空' }, { validator: this.handleInputId }],
                                    initialValue: basicInfo.idNumber,
                                })(
                                    <Input onBlur={this.onIdNumberChanged} />
                                )}
                            </Col>
                        </Form.Item>)
                        : null}
                    <Form.Item label="出生日期">
                        {getFieldDecorator('birthday', {
                            rules: [{
                                required: true,
                                message: '请选择出生日期',
                            }],
                            initialValue: basicInfo.birthday ? getFormateDate(basicInfo.birthday) : moment('1960-01-01')
                        })
                            (<DatePicker />)}
                    </Form.Item>
                    <Form.Item label="社保卡号">
                        <Col span={10}>
                            {getFieldDecorator('securityNumber', {
                                initialValue: basicInfo.securityNumber
                            })
                                (
                                    <Input />
                                )}
                        </Col>
                    </Form.Item>
                    <Form.Item label="户籍">
                        {getFieldDecorator('huji', {
                            initialValue: basicInfo.huji || 0,
                        })(
                            <Radio.Group>
                                <Radio value={0}>本地户口</Radio>
                                <Radio value={1}>外地户口</Radio>
                            </Radio.Group>
                        )}
                    </Form.Item>
                    {getFieldValue('huji') === 1 && <Form.Item label="户籍所在地">
                        <Col span={10}>
                            {getFieldDecorator('address', {
                                initialValue: basicInfo.address
                            })(
                                <Cascader options={cityList} placeholder="请选择" />
                            )}
                        </Col>
                    </Form.Item>}
                    <Form.Item label="居住地址">
                        <Col span={10}>
                            {getFieldDecorator('road', {
                                initialValue: basicInfo.road
                            })
                                (
                                    <Input />)}
                        </Col>
                    </Form.Item>
                    <Form.Item label="文化程度">
                        {getFieldDecorator('cultureLevel', {
                            initialValue: basicInfo.cultureLevel || culture[0]
                        })(
                            <Radio.Group >
                                {culture.length > 0 && culture.map((item, index) => {
                                    return (
                                        <Radio value={item} key={index}>{item}</Radio>
                                    )
                                })}
                            </Radio.Group>
                        )}
                    </Form.Item>
                    <Form.Item label="政治面貌">
                        {getFieldDecorator('zhengzhi', {
                            initialValue: basicInfo.religion
                        })(
                            <Radio.Group>
                                <Radio value={0}>群众</Radio>
                                <Radio value={1}>中共党员</Radio>
                                <Radio value={2}>民族党派</Radio>
                            </Radio.Group>
                        )}
                    </Form.Item>
                    {getFieldValue('zhengzhi') === 2 && <Form.Item label="民族党派">
                        <Col span={10}>
                            {getFieldDecorator('minzu', {
                                initialValue: basicInfo.religion
                            })(
                                <Input />
                            )}
                        </Col>
                    </Form.Item>}
                    <Form.Item label="宗教信仰">
                        <Col span={4}>
                            {getFieldDecorator('religion', {
                                initialValue: basicInfo.religion
                            })(
                                <Select
                                    placeholder="请选择"
                                >
                                    {religion.length > 0 && religion.map((item, index) => {
                                        return (
                                            <Option key={item} value={item}>{item}</Option>
                                        )
                                    })}
                                </Select>
                            )}
                        </Col>
                    </Form.Item>
                    {getFieldValue('religion') === religion[religion.length - 1] ?
                        (<Form.Item label='其他宗教信仰'>
                            <Col span={10} >
                                {getFieldDecorator('religionOther', {
                                    rules: [{ required: true, message: '其他宗教信仰不能为空' }],
                                    initialValue: basicInfo.religionOther
                                })(
                                    <Input />
                                )}
                            </Col>
                        </Form.Item>)
                        : null
                    }
                    <Form.Item label="婚姻状况">
                        {getFieldDecorator('maritalStatus', {
                            initialValue: basicInfo.maritalStatus || marry[marry.length - 1]
                        })(
                            <Radio.Group >
                                {marry.length > 0 && marry.map((item, index) => {
                                    return (
                                        <Radio value={item} key={index}>{item}</Radio>
                                    )
                                })}
                            </Radio.Group>,
                        )}
                    </Form.Item>
                    <Form.Item label="居住情况">
                        {getFieldDecorator('liveStatus', {
                            initialValue: basicInfo.liveStatus || house[1],
                            rules: [{
                                required: true,
                                message: '请选择居住情况',
                            }],
                        })(
                            <Radio.Group >
                                {house.length > 0 && house.map((item, index) => {
                                    return (
                                        <Radio value={item} key={index}>{item}</Radio>
                                    )
                                })}
                            </Radio.Group>,
                        )}
                    </Form.Item>
                    <Form.Item label="医疗费用支付方式">
                        {getFieldDecorator('payType', {
                            rules: [{
                                required: true,
                                message: '请选择医疗费用支付方式',
                            }],
                            initialValue: basicInfo.payType,
                        })(
                            <Checkbox.Group>
                                {medical.length > 0 && medical.map((item, index) => {
                                    return (<Col key={index} span={8}>
                                        <Checkbox value={item}>{item}</Checkbox>
                                    </Col>)
                                })}
                            </Checkbox.Group>
                        )
                        }
                    </Form.Item>
                    {getFieldValue('payType') !== undefined && getFieldValue('payType') !== null && getFieldValue('payType').indexOf(medical[medical.length - 1]) > -1 ?
                        (<Form.Item label='其他医疗费用支付方式'>
                            <Col span={10} >
                                {getFieldDecorator('payTypeOther', {
                                    rules: [{ required: true, message: '其他医疗费用支付方式不能为空' }],
                                    initialValue: basicInfo.payTypeOther
                                })(
                                    <Input />
                                )}
                            </Col>
                        </Form.Item>)
                        : null
                    }
                    <Form.Item label="经济来源">
                        {getFieldDecorator('incomeType', {
                            initialValue: basicInfo.incomeType || undefined
                        })(
                            <Checkbox.Group>
                                {economics.length > 0 && economics.map((item, index) => {
                                    return (
                                        <Col key={index} span={8}>
                                            <Checkbox value={item}>{item}</Checkbox>
                                        </Col>
                                    )
                                })}
                            </Checkbox.Group>,
                        )}
                    </Form.Item>
                    {getFieldValue('incomeType') !== undefined && getFieldValue('incomeType') !== null && getFieldValue('incomeType').indexOf(economics[economics.length - 1]) > -1 ?
                        (<Form.Item label='其他经济来源'>
                            <Col span={10} >
                                {getFieldDecorator('incomeTypeOther', {
                                    rules: [{ required: true, message: '其他经济来源不能为空' }],
                                    initialValue: basicInfo.incomeTypeOther
                                })(
                                    <Input />
                                )}
                            </Col>
                        </Form.Item>)
                        : null
                    }
                    <Form.Item label="特殊事项纪录">
                        <Col span={14}>
                            {getFieldDecorator('remark', {
                                initialValue: basicInfo.remark
                            })
                                (
                                    <TextArea />)}
                        </Col>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" disabled={this.state.invalid}>下一步</Button>
                    </Form.Item>
                </Form>
            </TableBlock>
        );
    }
}

export default Form.create()(BaseForm);
