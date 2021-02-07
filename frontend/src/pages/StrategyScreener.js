import React, { useState } from 'react';
import { useLocation } from "react-router-dom";
import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';
import Axios from 'axios';
import Select from "react-select";
import TradingViewWidget from 'react-tradingview-widget';
import { Form, Button, Alert, Row, Col, Accordion, Card } from 'react-bootstrap';
import filterFactory, { multiSelectFilter, numberFilter, Comparator } from 'react-bootstrap-table2-filter';
import { BsArrowsExpand, BsArrowsCollapse } from 'react-icons/bs';

import getApiUrl, {
    PriceFormatter, TimestampDateFormatter, onLastTradedFilterChange,
    PriceMovementFormatter, getTradeStrikeStr, getTradeTypeDisplay, getAllTradeTypes
} from '../utils';
import TickerTypeahead from '../components/TickerTypeahead';
import TickerSummary from '../components/TickerSummary.js';
import ModalSpinner from '../components/ModalSpinner';
import { useSearch } from "../components/querying"
import TradeDetailsCard from '../components/cards/TradeDetailsCard';
import TargetPriceRangeSlider from '../components/TargetPriceRangeSlider';


let lastTradedFilter;
let strategyFilter;
let minVolumeFilter;
let minOpenInterestFilter;

export default function BestCallByPrice() {
    let location = useLocation()
    const querySymbol = useSearch(location, 'symbol')

    const API_URL = getApiUrl();
    const [selectedTicker, setSelectedTicker] = useState([]);
    const [expirationTimestamps, setExpirationTimestamps] = useState([]);
    const [basicInfo, setbasicInfo] = useState({});
    const [showTimestampAlert, setShowTimestampAlert] = useState(false);
    const [showTargetPriceAlert, setShowTargetPriceAlert] = useState(false);
    const [bestStrategies, setBestStrategies] = useState(null);
    const [selectedExpirationTimestamp, setSelectedExpirationTimestamp] = useState(null);
    const [premiumType, setPremiumType] = useState('estimated');
    const [modalActive, setModalActive] = useState(false);
    const [targetPriceLower, setTargetPriceLower] = useState(null);
    const [targetPriceUpper, setTargetPriceUpper] = useState(null);

    const resetStates = () => {
        setSelectedTicker([]);
        setExpirationTimestamps([]);
        setbasicInfo({});
        setShowTimestampAlert(false);
        setShowTargetPriceAlert(false);
        setBestStrategies(null);
        setSelectedExpirationTimestamp(null);
        setPremiumType('immediate');
        setModalActive(false);
        setTargetPriceLower(null);
        setTargetPriceUpper(null);
    }

    const setStockInfo = (basicInfo) => {
        setbasicInfo(basicInfo);
        setTargetPriceLower(null);
        setTargetPriceUpper(null);
    }

    const headerSortingStyle = { backgroundColor: '#FF8F2B' };
    const result_table_columns = [
        {
            dataField: "type",
            text: "Strategy",
            formatter: (cell, row, rowIndex, extraData) => {
                return (
                    <span>
                        {getTradeTypeDisplay(cell)}<br />
                        <small>{getTradeStrikeStr(row)}</small>
                    </span>
                );
            }
        }, {
            dataField: "target_price_profit_ratio",
            text: "Hypothetical profit",
            hidden: targetPriceLower == null,
            formatter: (cell, row, rowIndex, extraData) => {
                if (cell != null) {
                    return (<span>{PriceMovementFormatter(cell, row.target_price_profit)}</span>);
                } else {
                    return (<span></span>);
                }
            },
            sort: true,
            headerSortingStyle,
        }, {
            dataField: "to_break_even_ratio",
            text: "Break-even",
            formatter: (cell, row, rowIndex, extraData) => (
                <span>
                    At {PriceMovementFormatter(cell, row.break_even_price)}
                </span>
            ),
            sort: true,
            headerSortingStyle,
        }, {
            dataField: "cost",
            text: "Cost / Max loss",
            formatter: (cell, row, rowIndex, extraData) => (
                PriceFormatter(cell)
            ),
            sort: true,
            headerSortingStyle,
        }, {
            dataField: "profit_cap_ratio",
            text: "Max profit",
            formatter: (cell, row, rowIndex, extraData) => (
                cell != null ?
                    (<span>{PriceMovementFormatter(cell, row.profit_cap)}</span>) : (<span>Unlimited</span>)
            ),
            sort: true,
            headerSortingStyle,
        }, {
            dataField: 'min_volume',
            text: 'Liquidity',
            formatter: (cell, row, rowIndex, extraData) => {
                return (
                    <span>
                        Volume: {cell}<br />
                        <small>Open: {row.min_open_interest}</small>
                    </span>
                );
            },
            sort: true,
            headerSortingStyle,
        },
        // Below fields are hidden and used for filtering only.
        {
            dataField: 'min_last_trade_date2',
            text: 'min_last_trade_date2',
            style: { 'display': 'none' },
            headerStyle: { 'display': 'none' },
            filter: numberFilter({
                getFilter: (filter) => {
                    lastTradedFilter = filter;
                }
            })
        }, {
            dataField: "type2",
            text: "type2",
            style: { 'display': 'none' },
            headerStyle: { 'display': 'none' },
            filter: multiSelectFilter({
                options: getAllTradeTypes(),
                defaultValue: getAllTradeTypes(),
                getFilter: (filter) => {
                    strategyFilter = filter;
                }
            })
        }, {
            dataField: "min_volume2",
            text: "min_volume2",
            style: { 'display': 'none' },
            headerStyle: { 'display': 'none' },
            filter: numberFilter({
                getFilter: (filter) => {
                    minVolumeFilter = filter;
                }
            })
        }, {
            dataField: "min_open_interest",
            text: "min_open_interest",
            style: { 'display': 'none' },
            headerStyle: { 'display': 'none' },
            filter: numberFilter({
                getFilter: (filter) => {
                    minOpenInterestFilter = filter;
                }
            })
        },
    ];
    const defaultSorted = [{
        dataField: "target_price_profit_ratio",
        order: "desc"
    }];

    function onStrategyFilterChange(event, strategyFilter) {
        const { value } = event.target;
        if (value == 'all') {
            strategyFilter(getAllTradeTypes());
        } else {
            strategyFilter([value]);
        }
    };

    function onVolumeFilterChange(event, volumeFilter) {
        const { value } = event.target;
        volumeFilter({
            number: value,
            comparator: Comparator.GE
        });
    };

    function onOpenInterestFilterChange(event, openInterestFilter) {
        const { value } = event.target;
        openInterestFilter({
            number: value,
            comparator: Comparator.GE
        });
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const form = event.currentTarget;
        const formData = new FormData(event.target);
        const formDataObj = Object.fromEntries(formData.entries());

        if (selectedExpirationTimestamp == null) {
            setShowTimestampAlert(true);
            return;
        } else {
            setShowTimestampAlert(false);
        }

        if (targetPriceLower == null || targetPriceUpper == null) {
            setShowTargetPriceAlert(true);
            return;
        } else {
            setShowTargetPriceAlert(false);
        }

        if (form.checkValidity() !== false && selectedExpirationTimestamp != null) {
            getBestStrategies(selectedExpirationTimestamp, formDataObj.available_cash);
        }
    };

    const handlePremiumTypeChange = (event) => {
        const target = event.target;
        setPremiumType(target.value);
    };

    const getBestStrategies = async (selectedExpirationTimestamp, availableCash) => {
        try {
            let url = `${API_URL}/tickers/${selectedTicker[0].symbol}/trades/?`;
            url += `expiration_timestamps=${selectedExpirationTimestamp.value}&`;
            url += `target_price_lower=${targetPriceLower}&target_price_upper=${targetPriceUpper}&`;
            url += `premium_type=${premiumType}&`
            if (availableCash) {
                url += `available_cash=${availableCash}&`;
            }
            setModalActive(true);
            const response = await Axios.get(url);
            let trades = response.data.trades;
            trades.map((val, index) => {
                val.type2 = val.type;
                val.min_last_trade_date2 = val.min_last_trade_date;
                val.min_volume2 = val.min_volume;
                val.id = index;
                return val;
            })
            setBestStrategies(trades);
            setModalActive(false);
        } catch (error) {
            console.error(error);
            setModalActive(false);
        }
    };

    const ExpandTradeRow = {
        renderer: (row) => (
            <TradeDetailsCard trade={row} hideDisclaimer={true} />
        ),
        showExpandColumn: true,
        expandHeaderColumnRenderer: ({ isAnyExpands }) => {
            if (isAnyExpands) {
                return (<BsArrowsCollapse style={{ "cursor": "pointer" }} />);
            }
            return (<BsArrowsExpand style={{ "cursor": "pointer" }} />);
        },
        expandColumnRenderer: ({ expanded }) => {
            if (expanded) {
                return (<BsArrowsCollapse style={{ "cursor": "pointer" }} />);
            }
            return (<BsArrowsExpand style={{ "cursor": "pointer" }} />);
        }
    }

    const expirationTimestampsOptions = [];
    expirationTimestamps.map((timestamp, index) => {
        // Yahoo's timestamp * 1000 = TD's timestamp.
        const date = new Date(timestamp < 9999999999 ? timestamp * 1000 : timestamp)
            .toLocaleDateString('en-US');
        expirationTimestampsOptions.push({ value: timestamp, label: date });
    })

    return (
        <div id="content" className="container min-vh-100" style={{ "marginTop": "4rem" }}>
            <ModalSpinner active={modalActive}></ModalSpinner>
            <h1 className="text-center">Strategy Screener</h1>
            <Form>
                <Form.Group>
                    <Form.Label className="requiredField"><h4>Enter ticker symbol:</h4></Form.Label>
                    <TickerTypeahead
                        querySymbol={querySymbol}
                        selectedTicker={selectedTicker}
                        setSelectedTicker={setSelectedTicker}
                        setExpirationTimestamps={setExpirationTimestamps}
                        setbasicInfo={setStockInfo}
                        resetStates={resetStates}
                        setModalActive={setModalActive}
                    />
                </Form.Group>
            </Form>
            {selectedTicker.length > 0 ?
                <div>
                    <TickerSummary basicInfo={basicInfo} />
                    <br />
                    <Accordion>
                        <Card>
                            <Accordion.Toggle as={Button} variant="link" eventKey="0">
                                <span className="text-dark">Price Chart</span>
                            </Accordion.Toggle>
                            <Accordion.Collapse eventKey="0">
                                <Card.Body>
                                    <TradingViewWidget
                                        symbol={basicInfo.symbol}
                                    />
                                </Card.Body>
                            </Accordion.Collapse>
                        </Card>
                    </Accordion>
                    <br />
                    <div>
                        <Form onSubmit={handleSubmit}>
                            <Form.Group>
                                <h4>Select an option expiration date:</h4>
                                <Row>
                                    <div className="col-sm-12">
                                        <Select
                                            defaultValue={selectedExpirationTimestamp}
                                            isClearable
                                            onChange={setSelectedExpirationTimestamp}
                                            options={expirationTimestampsOptions}
                                            className="basic-multi-select"
                                            classNamePrefix="select"
                                            placeholder="Select an options expiration date."
                                        />
                                    </div>
                                </Row>
                                <Row>
                                    <div className="col-sm-12">
                                        {showTimestampAlert ?
                                            <Alert variant="warning">
                                                Please select at least one expiration date.
                                            </Alert>
                                            : null
                                        }
                                    </div>
                                </Row>
                            </Form.Group>
                            <Form.Group>
                                <h4>Enter target price range of {selectedTicker[0].symbol} share on {selectedExpirationTimestamp ?
                                    TimestampDateFormatter(selectedExpirationTimestamp.value / 1000) : "expiration day"}
                                    : {targetPriceLower != null ? <span>{PriceFormatter(targetPriceLower)} - {PriceFormatter(targetPriceUpper)}</span> : null}
                                </h4>
                            </Form.Group>
                            <div style={{ marginLeft: '2.5rem', marginRight: '2.5rem', marginBottom: '3.5rem' }}>
                                <TargetPriceRangeSlider
                                    currentPrice={basicInfo.regularMarketPrice}
                                    setPriceLower={setTargetPriceLower}
                                    setPriceUpper={setTargetPriceUpper} />
                            </div>
                            <Row>
                                <div className="col-sm-12">
                                    {showTargetPriceAlert ?
                                        <Alert variant="warning">
                                            Please select a target price range.
                                            </Alert>
                                        : null
                                    }
                                </div>
                            </Row>
                            {/* <h4>Optional settings:</h4> */}
                            <Row>
                                <Col sm="6">
                                    <Form.Group>
                                        <Form.Label>Cash to invest in {selectedTicker[0].symbol} (optional):</Form.Label>
                                        <Form.Control name="available_cash" as="input" type="number"
                                            placeholder="Enter the amount that you could afford to loss."
                                            min="0.0" max="100000000.0" step="0.01" />
                                    </Form.Group>
                                </Col>
                                <Col sm="6">
                                    <Form.Group>
                                        <Form.Label>Premium price options:</Form.Label>
                                        <Form.Control name="premium_type" as="select" defaultValue="immediate"
                                            onChange={handlePremiumTypeChange}>
                                            <option key="immediate" value="immediate">Market order price</option>
                                            <option key="estimated" value="estimated">Mid/mark price</option>
                                        </Form.Control>
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row>
                                <Col>
                                    <Button type="submit" className="btn btn-primary">Analyze</Button>
                                </Col>
                            </Row>
                        </Form>
                        <br />
                        {bestStrategies != null ?
                            <div>
                                <h4>Results</h4>
                                <Row>
                                    <Col sm="3" xs="6">
                                        <Form.Group>
                                            <Form.Label className="font-weight-bold">Strategy type:</Form.Label>
                                            <Form.Control name="strategy" as="select" defaultValue="all"
                                                onChange={(e) => onStrategyFilterChange(e, strategyFilter)}>
                                                <option key="all" value="all">All</option>
                                                {getAllTradeTypes().map((type, index) => {
                                                    return (
                                                        <option key={type} value={type}>{getTradeTypeDisplay(type)}</option>
                                                    );
                                                })}
                                            </Form.Control>
                                        </Form.Group>
                                    </Col>
                                    <Col sm="3" xs="6">
                                        <Form.Label className="font-weight-bold">Min volume:</Form.Label>
                                        <Form.Control name="volume" as="select" defaultValue={0}
                                            onChange={(e) => onVolumeFilterChange(e, minVolumeFilter)}>
                                            <option key="0" value="0">All</option>
                                            {[1, 5, 10, 20, 50, 100, 200, 500, 1000, 10000].map((v, index) => {
                                                return (
                                                    <option key={v} value={v}>{v}</option>
                                                );
                                            })}
                                        </Form.Control>
                                    </Col>
                                    <Col sm="3" xs="6">
                                        <Form.Label className="font-weight-bold">Min open interest:</Form.Label>
                                        <Form.Control name="open_interest" as="select" defaultValue={0}
                                            onChange={(e) => onOpenInterestFilterChange(e, minOpenInterestFilter)}>
                                            <option key="0" value="0">All</option>
                                            {[1, 5, 10, 20, 50, 100, 200, 500, 1000, 10000].map((v, index) => {
                                                return (
                                                    <option key={v} value={v}>{v}</option>
                                                );
                                            })}
                                        </Form.Control>
                                    </Col>
                                    <Col sm="3" xs="6">
                                        <Form.Group>
                                            <Form.Label className="font-weight-bold">Filter by last traded:</Form.Label>
                                            <Form.Control name="tradeoff" as="select" defaultValue={0}
                                                onChange={(e) => onLastTradedFilterChange(e, lastTradedFilter)}>
                                                <option key="9999999" value="9999999">All</option>
                                                {[1, 4, 8, 24, 48, 72, 120, 240].map((hour, index) => {
                                                    return (
                                                        <option key={hour} value={hour}>
                                                            Last traded in&nbsp;
                                                            {(hour <= 24 ? hour + (hour > 1 ? " hours" : " hour") : hour / 24 + " days")}
                                                        </option>
                                                    );
                                                })}
                                            </Form.Control>
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <p>
                                    *All results are based on estimated options value on expiration date.<br />
                                    *Hypothetical profit: average of possible profit outcomes under the assumption that {selectedTicker[0].symbol} share price will be within the target price range.
                                </p>
                                <Row>
                                    <Col>
                                        <BootstrapTable
                                            classes="table-responsive"
                                            bootstrap4={true}
                                            keyField="id"
                                            data={bestStrategies}
                                            columns={result_table_columns}
                                            pagination={paginationFactory({
                                                sizePerPage: 20,
                                                hidePageListOnlyOnePage: true
                                            })}
                                            noDataIndication="No eligible strategy found."
                                            bordered={false}
                                            expandRow={ExpandTradeRow}
                                            filter={filterFactory()}
                                            defaultSorted={defaultSorted}
                                            rowStyle={{ "cursor": "pointer" }}
                                        />
                                    </Col>
                                </Row>
                            </div>
                            :
                            null
                        }
                    </div >
                </div>
                :
                null
            }
        </div >
    );
}