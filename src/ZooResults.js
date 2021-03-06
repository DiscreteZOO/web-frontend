import React, { Component } from 'react';
import { Container, Row, Col } from 'reactstrap';
import ReactTable from "react-table";
import ChooseColumns from './ZooColumns';
/* DATA */
import objectProperties from './objectProperties.json';
import defaults from './defaults.json';

const camelToUnderscore = (s) => { 
    return s.replace(/\.?([A-Z])/g, function (x,y){return "_" + y.toLowerCase()}).replace(/^_/, ""); 
}

class ZooResults extends Component {
    
    constructor(props) {
        super(props);
        
        this.getColumns = (colNames = []) => {
            const list = (colNames.length === 0 ? defaults.columns[this.props.objects] : colNames);
            const colObjects = list.map((columnName) => {
                var c = objectProperties[this.props.objects][columnName];
                var obj = {
                    Header: c.display,
                    accessor: columnName
                };
                return obj;  
            })
            return colObjects;
        }
        
        this.state = {
            columnKeys: defaults.columns[this.props.objects],
            columns: this.getColumns(),
            data: null,
            pages: null,
            loading: false,
        };
        
        this.fetchData = this.fetchData.bind(this);
        this.applyColumns = this.applyColumns.bind(this);
    }
    
    componentDidMount() {
        this.fetchData();
    }
    
    componentDidUpdate(pp, ps) {
        // ok to just compare strings, the objects are sorted and numeric comparisons standardized
        if (this.props.objects !== pp.objects || this.props.parameters !== pp.parameters) {
            this.fetchData();
        }
    }
    
    applyColumns(newColumns) {
        this.setState({ 
            columnKeys: newColumns,
            columns: this.getColumns(newColumns)
        });
    }
    
    fetchData(state, instance) {
        this.setState({ loading: true });
        var queryJSON = {
            pageSize: 20,
            page: 1,
            parameters: JSON.parse(this.props.parameters),
            orderBy: []
        }
        const flattenData = (row) => {
            var obj = (this.props.objects === "graphs" ? { zooid: row.zooid } : {});
            if (this.props.objects === "graphs") {
                Object.keys(row.index).forEach(function(key) { obj[camelToUnderscore(key)] = row.index[key]; });
            }
            Object.keys(row.bool).forEach(function(key) { obj[camelToUnderscore(key)] = String(row.bool[key]); });
            Object.keys(row.numeric).forEach(function(key) { obj[camelToUnderscore(key)] = row.numeric[key]; });
            if (this.props.objects === "maniplexes") {
                Object.keys(row.string).forEach(function(key) { obj[camelToUnderscore(key)] = row.string[key]; });
            }
            return obj;
        }
        const toApiOrder = (sort) => {
            return { name: sort.id, value: (sort.desc ? "DESC" : "ASC") };
        }
        if (typeof state !== 'undefined') {
            queryJSON.pageSize = state.pageSize;
            queryJSON.page = state.page + 1;
            queryJSON.orderBy = state.sorted.map(toApiOrder);
        }
        this.props.postData('/results', queryJSON).then(data => {
            this.setState({
                data: data.data.map(flattenData), 
                pages: data.pages,
                loading: false
            });
        }).catch(error => console.error(error));
    }
    
    render() {
        return (
            <section id="results">
                <Container>
                    <Row>
                        <Col lg="12">
                            <div>
                                <ChooseColumns 
                                    objects={this.props.objects} 
                                    current={this.state.columnKeys} 
                                    apply={this.applyColumns}
                                />
                            </div>
                            <div className="table-responsive">
                                {this.state.data !== null &&
                                    <ReactTable manual
                                        data={this.state.data} 
                                        columns={this.state.columns}
                                        defaultPageSize={20}
                                        pages={this.state.pages}
                                        onFetchData={this.fetchData}
                                        loading={this.state.loading} // Display the loading overlay when we need it
                                    />
                                }
                            </div>
                       </Col>
                    </Row>
                </Container>
            </section>
        );
    }
}



export default ZooResults;