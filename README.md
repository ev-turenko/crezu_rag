# Tengebai.kz Calculator Autotest

This Python autotest automates testing of the calculator functionality on the tengebai.kz website. It uses Playwright for browser automation to navigate to the site, find and click calculator buttons, and verify that the correct page opens.

## Features

- **Browser Automation**: Uses Playwright to control a Chromium browser
- **Smart Element Detection**: Intelligently finds calculator buttons using multiple selectors
- **Page Verification**: Verifies that opened pages contain calculator-specific elements
- **Screenshot Capture**: Takes screenshots at key moments for debugging
- **Detailed Reporting**: Provides comprehensive test results and error messages

## Prerequisites

- Python 3.7 or higher
- pip (Python package manager)

## Installation

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Install Playwright browsers:**
   ```bash
   playwright install chromium
   ```

## Usage

### Basic Test Run
```bash
python tengebai_autotest.py
```

### Run in Headless Mode (no browser window)
```bash
python tengebai_autotest.py --headless
```

### Run with Debug Mode (slower, shows more details)
```bash
python tengebai_autotest.py --debug
```

### Combine Options
```bash
python tengebai_autotest.py --headless --debug
```

## Test Flow

The autotest follows this sequence:

1. **Setup**: Launches a Chromium browser with configured settings
2. **Navigation**: Navigates to `https://tengebai.kz`
3. **Button Detection**: Searches for calculator buttons using multiple strategies:
   - Text matching (Калькулятор, Calculator, Рассчитать, etc.)
   - CSS class/ID patterns
   - Generic button analysis
4. **Button Click**: Clicks the identified calculator button
5. **Page Verification**: Checks the opened page for calculator elements:
   - Input fields (amount, term, interest)
   - Calculate buttons
   - Result displays
   - Calculator-specific text
6. **Cleanup**: Closes browser and releases resources

## Output Files

The test generates these files:

- `tengebai_homepage.png`: Screenshot of the homepage
- `before_calculator_click.png`: Screenshot before clicking calculator button
- `after_calculator_click.png`: Screenshot after clicking calculator button

## Test Results

The script provides detailed output including:

- Step-by-step execution status
- Found elements and their properties
- Page titles and URLs
- Verification results
- Error messages (if any)

## Customization

You can modify the test behavior by editing these parameters in `tengebai_autotest.py`:

- **Browser settings**: Change `headless` and `slow_mo` in the constructor
- **Selectors**: Modify `calculator_selectors` list for different button patterns
- **Verification criteria**: Update `calculator_elements` and `calculator_keywords` lists
- **Timeouts**: Adjust timeout values in navigation and wait operations

## Troubleshooting

### Common Issues

1. **"No calculator button found"**
   - The website might use different button text or structure
   - Check the homepage screenshot to see actual button text
   - Update the `calculator_selectors` list in the script

2. **Browser doesn't launch**
   - Ensure Playwright browsers are installed: `playwright install chromium`
   - Check Python and Playwright versions

3. **Test times out**
   - The website might be slow to load
   - Increase timeout values in the script
   - Run with `--debug` flag to see detailed timing

4. **SSL/Connection errors**
   - The website might have certificate issues
   - Try accessing the site manually first
   - Check network connectivity

### Debugging Tips

- Run with `--debug` flag to see detailed execution
- Check generated screenshots to see what the browser sees
- Add `print()` statements to trace execution flow
- Use browser developer tools to inspect element selectors

## Extending the Test

To add more test scenarios:

1. **Test different calculator types**:
   - Modify the script to test multiple calculator buttons
   - Add parameterized test cases

2. **Add form interaction**:
   - Extend the script to fill calculator forms
   - Test calculation results

3. **Add assertions**:
   - Include specific assertions for expected values
   - Validate calculation results

4. **Create test suite**:
   - Convert to pytest format for better test organization
   - Add setup/teardown fixtures

## Dependencies

- `playwright`: Browser automation framework
- `asyncio`: Async/await support
- `pytest` (optional): For test framework integration

## License

This autotest is provided as-is for testing purposes. Use responsibly and in accordance with the website's terms of service.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review generated screenshots and logs
3. Ensure you have the latest versions of dependencies