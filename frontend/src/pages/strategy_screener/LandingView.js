import React, { useState } from "react";
import { Container, Grid, Paper, TextField, Box, Button } from "@material-ui/core";
import {
    Autocomplete,
    ToggleButtonGroup,
    ToggleButton,
} from "@material-ui/lab/";
import TickerAutocomplete from "../../components/TickerAutocomplete";

export default function LandingView(props) {
    const { allTickers, 
        selectedExpirationTimestamp, 
        onTickerSelectionChange, 
        expirationTimestampsOptions, 
        expirationDisabled, 
        sentiment, 
        onExpirationSelectionChange, 
        setTargetPriceBySentiment, 
        getBestStrategies, 
        bestStrategies } = props

    const handleSentiment = (event, newSentiment) => {
        setTargetPriceBySentiment(newSentiment)
    };
    
    return (
        <Container className="min-vh-100">
            <Grid container direction="row" justify="center" alignItems="center" >
                <Grid item>
                    <h1>Strategy Screener</h1>
                </Grid>
            </Grid>
            <br />
            <Grid container direction="row" justify="center" alignItems="center" >
                <Grid item xs={7}>
                    <p style={{ textAlign: "center" }}>
                        {" "}
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                        sed do eiusmod tempor incididunt ut labore et dolore
                        magna aliqua. Quis auctor elit sed vulputate mi sit amet
                        mauris. Ligula ullamcorper malesuada proin libero nunc
                        consequat interdum.{" "}
                    </p>
                </Grid>
            </Grid>
            <br />
            <Grid container direction="row" justify="center" alignItems="center" >
                <Grid item xs={6} align="center">
                    <Paper elevation={3}>
                        <Box p={4}>
                            <Grid container>
                                <Grid item>
                                    <h4> Enter Ticker Symbol </h4>
                                </Grid>
                            </Grid>
                            <Grid container>
                                <Grid item xs={12}>
                                    <TickerAutocomplete 
                                        tickers={allTickers}
                                        onChange={onTickerSelectionChange}
                                    />
                                </Grid>
                            </Grid>
                            <br />
                            <Grid container direction="row" justify="center" spacing={3} >
                                <Grid item xs={6}>
                                    <h4>Option Expiration Date</h4>
                                    <Autocomplete
                                        id="expiration-dates"
                                        multiple
                                        value={selectedExpirationTimestamp}
                                        options={expirationTimestampsOptions}
                                        getOptionLabel={(option) =>
                                            option.label
                                        }
                                        fullWidth
                                        disabled={expirationDisabled}
                                        onChange={onExpirationSelectionChange}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                variant="outlined"
                                                placeholder="Select an expiration date"
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <h4>How are you feeling?</h4>
                                    <ToggleButtonGroup
                                        value={sentiment}
                                        exclusive
                                        onChange={handleSentiment}
                                        size="large"
                                    >
                                        <ToggleButton value="bullish" disabled={expirationDisabled}>
                                            Bullish
                                        </ToggleButton>
                                        <ToggleButton value="bearish" disabled={expirationDisabled}>
                                            Bearish
                                        </ToggleButton>
                                    </ToggleButtonGroup>
                                </Grid>
                            </Grid>
                            <br />
                            <Grid container direction="row" justify="center" spacing={3} >
                                <Grid item xs={4}>
                                    <Button variant="contained" color="primary" size="large" onClick={getBestStrategies}>
                                        Analyze
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}
