#!/usr/bin/env python3
"""
Autotest for tengebai.kz calculator functionality.
This script tests the calculator button interaction and page navigation.
"""

import asyncio
import sys
from typing import Optional
from playwright.async_api import async_playwright, Page, Browser, BrowserContext


class TengebaiAutotest:
    """Autotest for tengebai.kz website calculator functionality."""
    
    def __init__(self, headless: bool = False, slow_mo: int = 100):
        """
        Initialize the autotest.
        
        Args:
            headless: Run browser in headless mode
            slow_mo: Slow down operations by specified milliseconds (for debugging)
        """
        self.headless = headless
        self.slow_mo = slow_mo
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.playwright = None
        
    async def setup(self):
        """Setup Playwright browser and context."""
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(
            headless=self.headless,
            slow_mo=self.slow_mo
        )
        self.context = await self.browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        self.page = await self.context.new_page()
        
    async def navigate_to_site(self):
        """Navigate to tengebai.kz website."""
        print("Navigating to tengebai.kz...")
        try:
            await self.page.goto('https://tengebai.kz', timeout=30000)
            await self.page.wait_for_load_state('networkidle')
            
            # Check if we successfully loaded the page
            title = await self.page.title()
            print(f"Page title: {title}")
            
            # Take screenshot for documentation
            await self.page.screenshot(path='tengebai_homepage.png')
            print("✓ Successfully loaded tengebai.kz")
            return True
        except Exception as e:
            print(f"✗ Failed to navigate to tengebai.kz: {e}")
            return False
    
    async def find_calculator_button(self):
        """
        Find and identify calculator buttons on the page.
        Returns the button element if found.
        """
        print("Looking for calculator buttons...")
        
        # Common selectors for calculator buttons
        calculator_selectors = [
            # Button with calculator-related text
            'button:has-text("Калькулятор")',
            'button:has-text("Calculator")',
            'button:has-text("Рассчитать")',
            'button:has-text("Calculate")',
            'button:has-text("Посчитать")',
            
            # Button with calculator icon or class
            'button[class*="calculator"]',
            'button[class*="calc"]',
            'button[id*="calculator"]',
            'button[id*="calc"]',
            
            # Link buttons
            'a:has-text("Калькулятор")',
            'a:has-text("Calculator")',
            
            # Generic button with calculator-like text
            'button:has-text("Расчет")',
            'button:has-text("Подсчитать")',
        ]
        
        for selector in calculator_selectors:
            try:
                button = self.page.locator(selector)
                count = await button.count()
                if count > 0:
                    print(f"Found calculator button with selector: {selector}")
                    
                    # Get button details
                    for i in range(min(count, 3)):  # Check first 3 buttons
                        btn = button.nth(i)
                        text = await btn.text_content()
                        is_visible = await btn.is_visible()
                        is_enabled = await btn.is_enabled()
                        
                        print(f"  Button {i+1}:")
                        print(f"    Text: {text}")
                        print(f"    Visible: {is_visible}")
                        print(f"    Enabled: {is_enabled}")
                    
                    return button.first()  # Return first matching button
            except Exception as e:
                continue
        
        # If no specific calculator button found, look for any prominent button
        print("No specific calculator button found, looking for prominent buttons...")
        
        # Get all buttons on the page
        all_buttons = self.page.locator('button, a[role="button"]')
        button_count = await all_buttons.count()
        print(f"Total buttons on page: {button_count}")
        
        # Look for buttons with calculator-like functionality
        for i in range(min(button_count, 20)):  # Check first 20 buttons
            try:
                button = all_buttons.nth(i)
                text = await button.text_content()
                if text and any(keyword in text.lower() for keyword in 
                               ['калькулятор', 'calculator', 'рассчитать', 'calculate', 'посчитать', 'расчет']):
                    print(f"Found potential calculator button: '{text}'")
                    return button
            except Exception:
                continue
        
        print("✗ No calculator button found")
        return None
    
    async def click_calculator_button(self, button):
        """
        Click the calculator button and wait for navigation.
        
        Args:
            button: The button element to click
            
        Returns:
            bool: True if click was successful and page loaded
        """
        print("Clicking calculator button...")
        
        try:
            # Take screenshot before click
            await self.page.screenshot(path='before_calculator_click.png')
            
            # Get current URL before click
            current_url = self.page.url
            
            # Click the button
            await button.click()
            
            # Wait for navigation or page change
            try:
                # Wait for URL to change or new page to load
                await self.page.wait_for_url('**', timeout=10000)
            except:
                # If URL doesn't change, wait for network idle
                await self.page.wait_for_load_state('networkidle')
            
            # Take screenshot after click
            await self.page.screenshot(path='after_calculator_click.png')
            
            # Get new URL
            new_url = self.page.url
            print(f"URL before click: {current_url}")
            print(f"URL after click: {new_url}")
            
            if new_url != current_url:
                print("✓ Successfully navigated to new page")
            else:
                print("✓ Button clicked, but URL didn't change (might be modal or same-page calculator)")
            
            return True
            
        except Exception as e:
            print(f"✗ Failed to click calculator button: {e}")
            return False
    
    async def verify_opened_page(self):
        """
        Verify that the opened page is a calculator or result page.
        
        Returns:
            dict: Verification results with details
        """
        print("Verifying opened page...")
        
        verification = {
            'success': False,
            'page_title': '',
            'url': '',
            'calculator_elements_found': [],
            'page_indicators': {}
        }
        
        try:
            # Get page details
            verification['page_title'] = await self.page.title()
            verification['url'] = self.page.url
            
            print(f"Page title: {verification['page_title']}")
            print(f"Page URL: {verification['url']}")
            
            # Look for calculator-specific elements
            calculator_elements = [
                # Input fields
                ('input[type="number"]', 'Number input'),
                ('input[placeholder*="сумма"]', 'Amount input'),
                ('input[placeholder*="amount"]', 'Amount input (EN)'),
                ('input[placeholder*="срок"]', 'Term input'),
                ('input[placeholder*="term"]', 'Term input (EN)'),
                ('input[placeholder*="процент"]', 'Interest input'),
                ('input[placeholder*="interest"]', 'Interest input (EN)'),
                
                # Calculator buttons
                ('button:has-text("Рассчитать")', 'Calculate button'),
                ('button:has-text("Calculate")', 'Calculate button (EN)'),
                ('button:has-text("Посчитать")', 'Count button'),
                
                # Result displays
                ('div[class*="result"]', 'Result container'),
                ('div[class*="total"]', 'Total amount'),
                ('div[class*="monthly"]', 'Monthly payment'),
                ('span[class*="amount"]', 'Amount display'),
                
                # Calculator-specific text
                ('text="Ежемесячный платеж"', 'Monthly payment text'),
                ('text="Monthly payment"', 'Monthly payment text (EN)'),
                ('text="Общая сумма"', 'Total amount text'),
                ('text="Total amount"', 'Total amount text (EN)'),
                ('text="Процентная ставка"', 'Interest rate text'),
                ('text="Interest rate"', 'Interest rate text (EN)'),
            ]
            
            for selector, description in calculator_elements:
                try:
                    element = self.page.locator(selector)
                    count = await element.count()
                    if count > 0:
                        verification['calculator_elements_found'].append({
                            'selector': selector,
                            'description': description,
                            'count': count
                        })
                        print(f"✓ Found: {description} ({count} elements)")
                except Exception:
                    continue
            
            # Check for form elements
            forms = self.page.locator('form')
            form_count = await forms.count()
            verification['page_indicators']['form_count'] = form_count
            print(f"Forms on page: {form_count}")
            
            # Check for input fields
            inputs = self.page.locator('input, select, textarea')
            input_count = await inputs.count()
            verification['page_indicators']['input_count'] = input_count
            print(f"Input fields on page: {input_count}")
            
            # Check page content for calculator keywords
            page_text = await self.page.text_content('body')
            calculator_keywords = [
                'калькулятор', 'calculator', 'рассчитать', 'calculate',
                'кредит', 'credit', 'заем', 'loan', 'ипотека', 'mortgage',
                'процент', 'interest', 'ставка', 'rate', 'платеж', 'payment',
                'сумма', 'amount', 'срок', 'term', 'месяц', 'month'
            ]
            
            found_keywords = []
            for keyword in calculator_keywords:
                if keyword in page_text.lower():
                    found_keywords.append(keyword)
            
            verification['page_indicators']['found_keywords'] = found_keywords
            print(f"Calculator keywords found: {', '.join(found_keywords)}")
            
            # Determine if this looks like a calculator page
            is_calculator_page = (
                len(verification['calculator_elements_found']) > 0 or
                'калькулятор' in verification['page_title'].lower() or
                'calculator' in verification['page_title'].lower() or
                any(keyword in verification['url'].lower() for keyword in ['calculator', 'calc', 'calculate', 'расчет'])
            )
            
            verification['success'] = is_calculator_page
            
            if is_calculator_page:
                print("✓ Page appears to be a calculator/result page")
            else:
                print("⚠ Page doesn't appear to be a calculator page")
                
            return verification
            
        except Exception as e:
            print(f"✗ Error during page verification: {e}")
            verification['error'] = str(e)
            return verification
    
    async def test_calculator_functionality(self):
        """
        Main test function that orchestrates the entire test flow.
        
        Returns:
            dict: Test results with success status and details
        """
        print("=" * 60)
        print("Starting Tengebai.kz Calculator Autotest")
        print("=" * 60)
        
        test_results = {
            'test_name': 'Tengebai.kz Calculator Test',
            'steps': {},
            'overall_success': False,
            'errors': []
        }
        
        try:
            # Step 1: Setup browser
            print("\n[Step 1] Setting up browser...")
            await self.setup()
            test_results['steps']['setup'] = {'success': True, 'message': 'Browser setup complete'}
            print("✓ Browser setup complete")
            
            # Step 2: Navigate to site
            print("\n[Step 2] Navigating to tengebai.kz...")
            navigation_success = await self.navigate_to_site()
            test_results['steps']['navigation'] = {
                'success': navigation_success,
                'message': 'Navigation to tengebai.kz' + (' successful' if navigation_success else ' failed')
            }
            
            if not navigation_success:
                test_results['errors'].append('Failed to navigate to tengebai.kz')
                return test_results
            
            # Step 3: Find calculator button
            print("\n[Step 3] Finding calculator button...")
            calculator_button = await self.find_calculator_button()
            
            if calculator_button:
                button_text = await calculator_button.text_content()
                test_results['steps']['find_button'] = {
                    'success': True,
                    'message': f'Found calculator button: "{button_text}"'
                }
                print(f"✓ Found calculator button: '{button_text}'")
            else:
                test_results['steps']['find_button'] = {
                    'success': False,
                    'message': 'No calculator button found'
                }
                test_results['errors'].append('No calculator button found on the page')
                print("✗ No calculator button found")
                return test_results
            
            # Step 4: Click calculator button
            print("\n[Step 4] Clicking calculator button...")
            click_success = await self.click_calculator_button(calculator_button)
            test_results['steps']['click_button'] = {
                'success': click_success,
                'message': 'Calculator button click' + (' successful' if click_success else ' failed')
            }
            
            if not click_success:
                test_results['errors'].append('Failed to click calculator button')
                return test_results
            
            # Step 5: Verify opened page
            print("\n[Step 5] Verifying opened page...")
            verification = await self.verify_opened_page()
            test_results['steps']['verification'] = verification
            
            # Determine overall test success
            test_results['overall_success'] = (
                test_results['steps']['navigation']['success'] and
                test_results['steps']['find_button']['success'] and
                test_results['steps']['click_button']['success'] and
                verification.get('success', False)
            )
            
            if test_results['overall_success']:
                print("\n" + "=" * 60)
                print("✅ TEST PASSED: Calculator functionality works correctly")
                print("=" * 60)
            else:
                print("\n" + "=" * 60)
                print("❌ TEST FAILED: Issues found with calculator functionality")
                print("=" * 60)
                
                if test_results['errors']:
                    print("Errors encountered:")
                    for error in test_results['errors']:
                        print(f"  - {error}")
            
            return test_results
            
        except Exception as e:
            print(f"\n✗ Test execution failed with error: {e}")
            test_results['overall_success'] = False
            test_results['errors'].append(str(e))
            return test_results
            
        finally:
            # Step 6: Cleanup
            print("\n[Step 6] Cleaning up...")
            await self.cleanup()
            print("✓ Cleanup complete")
    
    async def cleanup(self):
        """Clean up browser resources."""
        try:
            if self.page:
                await self.page.close()
            if self.context:
                await self.context.close()
            if self.browser:
                await self.browser.close()
            if self.playwright:
                await self.playwright.stop()
        except Exception as e:
            print(f"Warning during cleanup: {e}")


async def main():
    """Main entry point for the autotest."""
    # Parse command line arguments
    headless = '--headless' in sys.argv
    debug = '--debug' in sys.argv
    
    print("Tengebai.kz Calculator Autotest")
    print("=" * 40)
    
    # Create and run the autotest
    autotest = TengebaiAutotest(
        headless=headless,
        slow_mo=500 if debug else 100
    )
    
    results = await autotest.test_calculator_functionality()
    
    # Print summary
    print("\n" + "=" * 40)
    print("TEST SUMMARY")
    print("=" * 40)
    print(f"Test Name: {results['test_name']}")
    print(f"Overall Success: {'✅ PASS' if results['overall_success'] else '❌ FAIL'}")
    
    if results['overall_success']:
        print("\nAll test steps completed successfully!")
        print("Screenshots saved:")
        print("  - tengebai_homepage.png (homepage)")
        print("  - before_calculator_click.png (before click)")
        print("  - after_calculator_click.png (after click)")
    else:
        print("\nTest failed with the following issues:")
        for error in results.get('errors', []):
            print(f"  - {error}")
        
        # Print step results
        print("\nStep Results:")
        for step_name, step_result in results.get('steps', {}).items():
            if isinstance(step_result, dict):
                success = step_result.get('success', False)
                message = step_result.get('message', '')
                print(f"  {step_name}: {'✅' if success else '❌'} {message}")
    
    return 0 if results['overall_success'] else 1


if __name__ == "__main__":
    # Run the async main function
    exit_code = asyncio.run(main())
    sys.exit(exit_code)